"""Simple face recognition demo with photo capture."""
import os
import base64
import time
from pathlib import Path
from flask import Flask, render_template, request, jsonify
from deepface import DeepFace
from PIL import Image
import io

app = Flask(__name__)

# Configuration
FACES_DIR = Path(__file__).parent / "faces"
FACES_DIR.mkdir(exist_ok=True)

# Pre-load models at startup
print("Loading face recognition models (this takes ~10-20 seconds)...")
try:
    # Warmup with a dummy image
    import numpy as np
    dummy_image = np.zeros((224, 224, 3), dtype=np.uint8)
    dummy_path = FACES_DIR / "dummy_warmup.jpg"
    Image.fromarray(dummy_image).save(dummy_path)
    try:
        DeepFace.extract_faces(str(dummy_path), detector_backend="opencv", enforce_detection=False)
    except:
        pass
    if dummy_path.exists():
        dummy_path.unlink()
    print("Models loaded successfully!")
except Exception as e:
    print(f"Warning: Model loading failed: {e}")


@app.route('/')
def index():
    """Serve the main page."""
    return render_template('index.html')


@app.route('/register', methods=['POST'])
def register():
    """Register a new person by saving their photo."""
    try:
        data = request.get_json()
        image_data = data.get('image')
        person_name = data.get('name', '').strip()

        if not image_data:
            return jsonify({'success': False, 'message': 'No image provided'}), 400

        if not person_name:
            return jsonify({'success': False, 'message': 'Please enter a name'}), 400

        # Decode base64 image
        image_data = image_data.split(',')[1] if ',' in image_data else image_data
        image_bytes = base64.b64decode(image_data)

        # Save image with timestamp
        timestamp = int(time.time())
        filename = f"{person_name.lower().replace(' ', '_')}_{timestamp}.jpg"
        filepath = FACES_DIR / filename

        # Validate it's a real image and contains a face
        img = Image.open(io.BytesIO(image_bytes))
        img.save(filepath, "JPEG")

        # Check if face is detected
        try:
            faces = DeepFace.extract_faces(
                str(filepath),
                detector_backend="opencv",
                enforce_detection=True
            )
            if len(faces) == 0:
                filepath.unlink()
                return jsonify({'success': False, 'message': 'No face detected in image'}), 400
            elif len(faces) > 1:
                filepath.unlink()
                return jsonify({'success': False, 'message': f'Multiple faces detected ({len(faces)}). Please ensure only one face is visible.'}), 400
        except Exception as e:
            if filepath.exists():
                filepath.unlink()
            return jsonify({'success': False, 'message': f'Face detection error: {str(e)}'}), 400

        return jsonify({
            'success': True,
            'message': f'Successfully registered {person_name}',
            'filename': filename
        })

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@app.route('/recognize', methods=['POST'])
def recognize():
    """Check if the person in the photo matches any registered faces."""
    try:
        data = request.get_json()
        image_data = data.get('image')

        if not image_data:
            return jsonify({'success': False, 'message': 'No image provided'}), 400

        # Check if there are any registered faces
        registered_faces = list(FACES_DIR.glob("*.jpg"))
        if not registered_faces:
            return jsonify({
                'success': True,
                'recognized': False,
                'message': 'No registered faces in database. Please register someone first.'
            })

        # Decode base64 image and save temporarily
        image_data = image_data.split(',')[1] if ',' in image_data else image_data
        image_bytes = base64.b64decode(image_data)

        temp_path = FACES_DIR / f"temp_{int(time.time())}.jpg"
        img = Image.open(io.BytesIO(image_bytes))
        img.save(temp_path, "JPEG")

        try:
            # Check for face in image first
            faces = DeepFace.extract_faces(
                str(temp_path),
                detector_backend="opencv",
                enforce_detection=True
            )
            if len(faces) == 0:
                temp_path.unlink()
                return jsonify({'success': False, 'message': 'No face detected in image'}), 400
            elif len(faces) > 1:
                temp_path.unlink()
                return jsonify({'success': False, 'message': f'Multiple faces detected ({len(faces)}). Please ensure only one face is visible.'}), 400

            # Perform face recognition
            results = DeepFace.find(
                img_path=str(temp_path),
                db_path=str(FACES_DIR),
                model_name="Facenet512",
                detector_backend="opencv",
                distance_metric="cosine",
                enforce_detection=True,
                silent=True
            )

            # Clean up temp file
            temp_path.unlink()

            # Check if match found
            if not results or len(results) == 0 or results[0].empty:
                return jsonify({
                    'success': True,
                    'recognized': False,
                    'message': 'Unknown person - no match found'
                })

            # Get best match
            df = results[0]
            best_match = df.iloc[0]
            distance = float(best_match["Facenet512_cosine"])
            threshold = 0.4

            if distance > threshold:
                return jsonify({
                    'success': True,
                    'recognized': False,
                    'message': 'Unknown person - no match found'
                })

            # Extract person info from filename
            identity_path = Path(best_match["identity"])
            filename = identity_path.name
            person_name = filename.rsplit('_', 1)[0].replace('_', ' ').title()
            confidence = (1.0 - min(distance / threshold, 1.0)) * 100

            return jsonify({
                'success': True,
                'recognized': True,
                'name': person_name,
                'confidence': round(confidence, 1),
                'distance': round(distance, 3),
                'message': f'Recognized: {person_name} ({confidence:.1f}% confidence)'
            })

        except Exception as e:
            if temp_path.exists():
                temp_path.unlink()
            raise

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@app.route('/list', methods=['GET'])
def list_faces():
    """List all registered faces."""
    try:
        faces = []
        for filepath in FACES_DIR.glob("*.jpg"):
            if filepath.name.startswith("temp_"):
                continue
            filename = filepath.name
            person_name = filename.rsplit('_', 1)[0].replace('_', ' ').title()
            faces.append({
                'filename': filename,
                'name': person_name
            })

        faces.sort(key=lambda x: x['name'])

        return jsonify({
            'success': True,
            'faces': faces,
            'count': len(faces)
        })

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
