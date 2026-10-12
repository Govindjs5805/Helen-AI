import unittest

from main import flesch_kincaid_grade, simplification_prompt


class ReadabilityTests(unittest.TestCase):
    def test_flesch_kincaid_grade_uses_syllables_and_sentences(self):
        score = flesch_kincaid_grade('The cat sat. The dog ran.')
        self.assertIsNotNone(score)
        self.assertEqual(score, -2.6)

    def test_flesch_kincaid_grade_handles_empty_text(self):
        self.assertIsNone(flesch_kincaid_grade('  '))

    def test_simplification_prompt_preserves_constraints(self):
        prompt = simplification_prompt(
            'A source passage.',
            'dyslexia',
            'grade_4_5',
            ['photosynthesis'],
            14,
            'bullet_summary',
        )
        self.assertIn('never invent facts', prompt)
        self.assertIn('photosynthesis', prompt)
        self.assertIn('about 14 words or fewer', prompt)
        self.assertIn('bullet summary', prompt)


if __name__ == '__main__':
    unittest.main()
