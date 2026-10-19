import json
import unittest
from content_keys import ROOT, content_keys


class ContentCoverage(unittest.TestCase):
    def test_every_language_covers_rendered_islands_and_saints(self):
        keys = content_keys()
        self.assertGreater(len(keys), 4000)
        for path in sorted((ROOT / "public/i18n").glob("*.json")):
            with self.subTest(language=path.stem):
                dictionary = json.loads(path.read_text())
                missing = [key for key in keys if not dictionary.get(key)]
                self.assertEqual(missing, [], f"{path.stem}: {len(missing)} missing content translations")


if __name__ == "__main__":
    unittest.main()