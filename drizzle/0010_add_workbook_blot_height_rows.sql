INSERT INTO work_order_cells (
  machine,
  production_line,
  tooling_type,
  metric,
  spec_value,
  head1_a,
  head1_b,
  head2_a,
  head2_b,
  head3_a,
  head3_b,
  head4_a,
  head4_b
)
SELECT
  machine,
  'P1',
  'BLOT',
  'HEIGHT',
  '-',
  '-',
  '-',
  '-',
  '-',
  NULL,
  NULL,
  NULL,
  NULL
FROM work_order_machines
WHERE machine IN (
  'TP1','TP2','TP3','TP4','TP5','TP6','TP7','TP8','TP9',
  'TP13','TP14','TP15','TP17','TP18','TP19','TP20','TP21','TP23','TP24','TP25'
)
AND NOT EXISTS (
  SELECT 1
  FROM work_order_cells existing
  WHERE existing.machine = work_order_machines.machine
    AND existing.tooling_type = 'BLOT'
    AND existing.metric = 'HEIGHT'
);
