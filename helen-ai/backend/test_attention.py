import unittest

from pydantic import ValidationError

from main import (
    app,
    FocusSessionCreate,
    FocusSessionEvent,
    TaskBreakdownRequest,
    TaskBreakdownResponse,
    TaskStep,
)


class AttentionSchemaTests(unittest.TestCase):
    def test_attention_routes_are_in_openapi(self):
        paths = app.openapi()['paths']
        self.assertIn('/attention/focus-sessions', paths)
        self.assertIn('/attention/tasks/breakdown', paths)
        self.assertIn('/attention/planner', paths)
        self.assertIn('/attention/shares/invites', paths)
        self.assertIn('/attention/shares/redeem', paths)
        self.assertIn('/attention/admin/metrics', paths)

    def test_focus_session_minutes_are_bounded(self):
        self.assertEqual(FocusSessionCreate(planned_minutes=5).planned_minutes, 5)
        self.assertEqual(FocusSessionCreate(planned_minutes=45).planned_minutes, 45)
        with self.assertRaises(ValidationError):
            FocusSessionCreate(planned_minutes=4)

    def test_focus_event_accepts_only_known_nonjudgmental_events(self):
        self.assertEqual(FocusSessionEvent(event='stuck').event, 'stuck')
        with self.assertRaises(ValidationError):
            FocusSessionEvent(event='failure')

    def test_task_breakdown_requires_a_tiny_first_step(self):
        result = TaskBreakdownResponse.model_validate({
            'title': 'Read a worksheet',
            'steps': [TaskStep(id='step-1', text='Open the worksheet', estimated_minutes=1).model_dump()],
            'estimated_minutes': 1,
            'first_tiny_step': 'Open the worksheet',
        })
        self.assertEqual(result.first_tiny_step, result.steps[0].text)
        with self.assertRaises(ValidationError):
            TaskBreakdownResponse.model_validate({
                'title': 'Read a worksheet',
                'steps': [],
                'estimated_minutes': 0,
                'first_tiny_step': '',
            })

    def test_task_breakdown_request_validates_step_time(self):
        self.assertEqual(TaskBreakdownRequest(title='Study', max_step_minutes=1).max_step_minutes, 1)
        with self.assertRaises(ValidationError):
            TaskBreakdownRequest(title='Study', max_step_minutes=0)


if __name__ == '__main__':
    unittest.main()
