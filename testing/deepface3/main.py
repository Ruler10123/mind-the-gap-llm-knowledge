import faiss
import numpy as np
import pickle
from deepface import DeepFace

# 1. INITIALIZATION: Setup the "brain"
dimension = 128  # Dimension for 'Facenet' model
index = faiss.IndexFlatL2(dimension)
metadata_map = {} # ID -> {"name": "...", "email": "..."}

def register_user(image_path, user_info):
    # Convert face to vector
    embeddings = DeepFace.represent(img_path=image_path, model_name="Facenet")[0]["embedding"]
    vector = np.array([embeddings]).astype('float32')
    
    # Add to FAISS and save info
    user_id = index.ntotal 
    index.add(vector)
    metadata_map[user_id] = user_info
    print(f"Registered {user_info['name']} with ID {user_id}")

def login_search(current_frame):
    # 1. Get embedding of person at the camera
    login_vec = DeepFace.represent(img_path=current_frame, model_name="Facenet")[0]["embedding"]
    query_vec = np.array([login_vec]).astype('float32')
    
    # 2. Search FAISS index (Extremely fast)
    # D = distance, I = index/ID
    D, I = index.search(query_vec, k=1) 
    
    # 3. Validation
    if D[0][0] < 0.6: # Threshold depends on model; 0.6 is a starting point for L2
        matched_id = I[0][0]
        return metadata_map[matched_id]
    return None

# Test: Use deepface.find() to verify it works with the same image
if __name__ == "__main__":
    import os
    import shutil
    
    # Setup: Create a database folder and copy the image there
    db_path = "face_database"
    os.makedirs(db_path, exist_ok=True)
    
    # Copy the image to the database for testing
    test_image = "user_images/WIN_20260124_16_18_04_Pro.jpg"
    db_image_path = os.path.join(db_path, "test_face.jpg")
    if not os.path.exists(db_image_path):
        shutil.copy(test_image, db_image_path)
        print(f"Copied {test_image} to {db_image_path}")
    
    # Use deepface.find() to find the same image
    print("\nSearching for the face in the database using deepface.find()...")
    results = DeepFace.find(
        img_path=test_image,
        db_path=db_path,
        model_name="Facenet",
        enforce_detection=True,
        detector_backend="retinaface"
    )
    
    # Display results
    if results and len(results) > 0:
        print(f"\nFound {len(results[0])} match(es):")
        for idx, match in results[0].iterrows():
            print(f"  Match {idx + 1}:")
            print(f"    Path: {match['identity']}")
            print(f"    Distance: {match['distance']:.4f}")
            print(f"    Threshold: {match['threshold']:.4f}")
            print(f"    Match: {match['distance'] <= match['threshold']}")
    else:
        print("No matches found")