import pytest

from eval import answer_metrics as am


def test_normalize_replaces_punctuation_with_space():
    assert am.normalize("The Airport_Free_WiFi network!") == "airport free wifi network"
    assert am.normalize("30-45 minutes") == "30 45 minutes"
    assert am.normalize("(555) 123-4567") == "555 123 4567"


def test_exact_match_and_f1():
    assert am.exact_match("The 90 days.", "90 days") == 1.0
    assert am.exact_match("90 days", "ninety days") == 0.0
    assert am.token_f1("held for 90 days", "items are held for 90 days") == pytest.approx(
        2 * (4 / 4) * (4 / 6) / (4 / 4 + 4 / 6)
    )
    assert am.token_f1("", "") == 1.0
    assert am.token_f1("nothing shared", "90 days") == 0.0


def test_key_facts_alternatives_and_boundaries():
    answer = "Bags must be under 22x14x9 inches and 50 lbs."
    assert am.fact_present(answer, "22 x 14 x 9|22x14x9")
    assert am.fact_present(answer, "50 lbs")
    # Token boundaries: "5" must not match inside "50".
    assert not am.fact_present(answer, "5")
    assert am.key_fact_recall(answer, ["22x14x9", "23 kg"]) == 0.5
    assert am.key_fact_recall(answer, []) is None


@pytest.mark.parametrize("text", [
    "I don't have that information.",
    "I do not have specific details on that.",
    "I'm not sure about the pharmacy hours.",
    "The context doesn’t mention a smoking area.",
    "I can't find any information about drones.",
    "That isn't mentioned in the provided context.",
])
def test_refusals_detected(text):
    assert am.is_refusal(text)


@pytest.mark.parametrize("text", [
    "Online check-in opens 24 hours before departure.",
    "Gates may change, so please check the monitors regularly.",
    "No, sharp objects are not allowed in carry-on bags.",
    "Please check with your airline's customer service desk for rebooking.",
])
def test_answers_not_flagged_as_refusals(text):
    assert not am.is_refusal(text)


def test_groundedness():
    context = "Found items are held for 90 days at the Lost and Found office."
    assert am.groundedness("Items are held for 90 days.", context) == 1.0
    # items, shredded, after, 7, days -> only "items" and "days" are in context.
    assert am.groundedness("Items are shredded after 7 days.", context) == pytest.approx(2 / 5)
    assert am.groundedness("The.", context) is None
    assert am.groundedness("Items are held.", "") is None


def test_unsupported_numbers():
    ref = "Short-term parking is $4/hour, $32/day. Economy is $12/day."
    assert am.unsupported_numbers("It costs $32 per day.", ref) == []
    assert am.unsupported_numbers("It costs $35 per day or 1,200 a year.", ref) == ["1200", "35"]


def test_percentile():
    assert am.percentile([], 50) is None
    assert am.percentile([5.0], 95) == 5.0
    assert am.percentile([1, 2, 3, 4], 50) == 2.5
    assert am.percentile(list(range(1, 101)), 95) == pytest.approx(95.05)
