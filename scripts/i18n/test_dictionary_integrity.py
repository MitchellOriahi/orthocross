import collections
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


class DictionaryIntegrity(unittest.TestCase):
    def test_dictionaries_preserve_runtime_placeholders_and_brand(self):
        paths = sorted((ROOT / "public/i18n").glob("*.json"))
        self.assertEqual(len(paths), 16)
        keysets = []
        for path in paths:
            pairs = json.loads(path.read_text(), object_pairs_hook=list)
            self.assertEqual(len(pairs), len(dict(pairs)), f"duplicate keys: {path.stem}")
            dictionary = dict(pairs)
            keysets.append(set(dictionary))
            for source, value in dictionary.items():
                with self.subTest(language=path.stem, source=source[:80]):
                    self.assertIsInstance(value, str)
                    self.assertTrue(value.strip())
                    self.assertNotIn("\ufffd", value)
                    self.assertEqual(source.count("OrthoCross"), value.count("OrthoCross"))
                    placeholders = lambda text: collections.Counter(re.findall(r"\{[A-Za-z_]\w*\}", text))
                    self.assertEqual(placeholders(source), placeholders(value))
        for keys in keysets[1:]:
            self.assertEqual(keys, keysets[0])


if __name__ == "__main__":
    unittest.main()