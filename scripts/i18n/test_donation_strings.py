import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Wording the donation dialog's exchange-rate help relies on.
REQUIRED = [
    "Exchange rates",
    "Currency estimate",
    "Estimated equivalent",
    "Rate date: {date}",
    "Exchange rate unavailable",
    "Charged in US dollars. Your bank’s rate and fees may differ.",
]


class DonationStrings(unittest.TestCase):
    def test_every_language_explains_exchange_rates(self):
        paths = sorted((ROOT / "public" / "i18n").glob("*.json"))
        self.assertEqual(len(paths), 16, "expected one dictionary per supported language")
        for path in paths:
            with self.subTest(language=path.stem):
                dictionary = json.loads(path.read_text(encoding="utf-8"))
                missing = [key for key in REQUIRED if not dictionary.get(key)]
                self.assertEqual(missing, [], f"{path.stem}: missing {missing}")

    def test_english_source_is_the_fallback(self):
        dictionary = json.loads((ROOT / "public" / "i18n" / "el.json").read_text(encoding="utf-8"))
        self.assertNotEqual(dictionary["Exchange rates"], "Exchange rates")


if __name__ == "__main__":
    unittest.main()
