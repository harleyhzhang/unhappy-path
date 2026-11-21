import unittest
from metrics import score, bins, task_mean, interval

class MetricsContract(unittest.TestCase):
    def test_partial_directions_share_one_category(self):
        g={'gate':True,'pass':{'partial0':True,'partial1':False,'narrow':True}}
        self.assertEqual(bins(g)['partial'],.5)
        self.assertEqual(score(g),.75)
    def test_failed_gate_scores_zero(self):
        self.assertEqual(score({'gate':False,'pass':{'narrow':True,'a11y':True}}),0)
    def test_incomplete_repetitions_do_not_change_task_weights(self):
        self.assertEqual(task_mean({'a':[0,0,0],'b':[1]}),.5)
    def test_constant_task_bootstrap(self):
        self.assertEqual(interval({'a':[1,1,1],'b':[1]}),(1,1))
