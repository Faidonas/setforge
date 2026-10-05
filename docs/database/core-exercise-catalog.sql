-- SetForge core exercise catalogue.
-- This is a reviewed, Strong-inspired subset of the imported practice dataset.
-- Run after exercise-catalog-data.sql. Safe to rerun.

BEGIN;

UPDATE exercises
SET catalog_visible = FALSE
WHERE source_name = 'hasaneyldrm/exercises-dataset';

UPDATE exercises
SET catalog_visible = TRUE
WHERE source_name = 'hasaneyldrm/exercises-dataset'
  AND source_id IN (
    '1774', -- side bridge hip abduction
    '0710', -- side hip abduction
    '0001', -- 3/4 sit-up
    '0002', -- 45° side bend
    '0003', -- air bike
    '0084', -- barbell rollerout
    '0175', -- cable kneeling crunch
    '0222', -- cable side bend
    '0243', -- cable twist
    '0274', -- crunch floor
    '3016', -- curl-up
    '0277', -- decline crunch
    '0282', -- decline sit-up
    '0407', -- dumbbell side bend
    '2429', -- frog crunch
    '0464', -- front plank with twist
    '0472', -- hanging leg raise
    '0508', -- janda sit-up
    '0570', -- leg pull in flat bench
    '0620', -- lying leg raise flat bench
    '0872', -- reverse crunch
    '0687', -- russian twist
    '0871', -- tuck crunch
    '2135', -- weighted front plank
    '0168', -- cable hip adduction
    '1775', -- side plank hip adduction
    '0031', -- barbell curl
    '0038', -- barbell drag curl
    '0070', -- barbell preacher curl
    '0080', -- barbell reverse curl
    '0140', -- biceps pull-up
    '0868', -- cable curl
    '1632', -- cable drag curl
    '0206', -- cable reverse curl
    '1641', -- cable seated curl
    '0297', -- dumbbell concentration curl
    '0313', -- dumbbell hammer curl
    '0294', -- dumbbell biceps curl
    '0318', -- dumbbell incline curl
    '0372', -- dumbbell preacher curl
    '0374', -- dumbbell prone incline curl
    '0429', -- dumbbell standing reverse curl
    '1370', -- barbell floor calf raise
    '0088', -- barbell seated calf raise
    '1371', -- barbell seated calf raise
    '1372', -- barbell standing calf raise
    '1373', -- bodyweight standing calf raise
    '0284', -- donkey calf raise
    '0417', -- dumbbell standing calf raise
    '1383', -- hack calf raise
    '2289', -- lever calf press
    '2315', -- lever rotary calf
    '1160', -- burpee
    '0630', -- mountain climber
    '0685', -- run
    '3223', -- star jump (male)
    '0041', -- barbell front raise
    '0076', -- barbell rear delt row
    '0091', -- barbell seated overhead press
    '0120', -- barbell upright row
    '0128', -- battling ropes
    '0162', -- cable front raise
    '0178', -- cable lateral raise
    '0219', -- cable shoulder press
    '0246', -- cable upright row
    '2137', -- dumbbell arnold press
    '0299', -- dumbbell cuban press
    '0310', -- dumbbell front raise
    '0334', -- dumbbell lateral raise
    '0348', -- dumbbell lying rear lateral raise
    '1700', -- dumbbell push press
    '0378', -- dumbbell rear fly
    '0383', -- dumbbell reverse fly
    '2397', -- dumbbell scott press
    '0405', -- dumbbell seated shoulder press
    '0437', -- dumbbell upright row
    '0438', -- dumbbell w-press
    '0587', -- lever military press
    '0126', -- barbell wrist curl
    '0247', -- cable wrist curl
    '1437', -- dumbbell finger curls
    '0401', -- dumbbell seated palms up wrist curl
    '0455', -- finger curls
    '1428', -- wrist circles
    '0032', -- barbell deadlift
    '0042', -- barbell front squat
    '0043', -- barbell full squat
    '1409', -- barbell glute bridge
    '0054', -- barbell lunge
    '0074', -- barbell rack pull
    '0085', -- barbell romanian deadlift
    '0114', -- barbell step-up
    '0157', -- cable deadlift
    '3769', -- curtsey squat
    '0300', -- dumbbell deadlift
    '0336', -- dumbbell lunge
    '1459', -- dumbbell romanian deadlift
    '0413', -- dumbbell squat
    '0431', -- dumbbell step-up
    '0432', -- dumbbell stiff leg deadlift
    '0514', -- jump squat
    '0534', -- kettlebell goblet squat
    '3582', -- lunge with jump
    '0628', -- monster walk
    '1476', -- one leg squat
    '1463', -- sled 45° leg press (side pov)
    '0743', -- sled hack squat
    '0770', -- smith squat
    '1460', -- walking lunge
    '0044', -- barbell good morning
    '0116', -- barbell straight leg deadlift
    '3235', -- cable assisted inverse leg curl
    '0496', -- inverse leg curl (bench support)
    '0582', -- lever kneeling leg curl
    '0586', -- lever lying leg curl
    '3195', -- lever lying two-one leg curl
    '0599', -- lever seated leg curl
    '0795', -- standing single leg curl
    '0017', -- assisted pull-up
    '0073', -- barbell pullover
    '0172', -- cable incline pushdown
    '2330', -- cable lat pulldown full range of motion
    '3563', -- cable one arm pulldown
    '0198', -- cable pulldown
    '0205', -- cable rear pulldown
    '1326', -- chin-up
    '1327', -- close grip chin-up
    '0579', -- lever front pulldown
    '2285', -- lever pullover
    '0627', -- mixed grip chin-up
    '0652', -- pull-up
    '0674', -- reverse grip pull-up
    '0678', -- rocky pull-up pulldown
    '1763', -- shoulder grip pull-up
    '0818', -- twin handle parallel grip lat pulldown
    '1429', -- wide grip pull-up
    '3294', -- archer push up
    '0025', -- barbell bench press
    '0033', -- barbell decline bench press
    '0047', -- barbell incline bench press
    '0179', -- cable low fly
    '0185', -- cable lying fly
    '0188', -- cable middle fly
    '0251', -- chest dip
    '1273', -- clap push up
    '0258', -- clock push-up
    '0279', -- decline push-up
    '1274', -- deep push up
    '1275', -- drop push up
    '0289', -- dumbbell bench press
    '0301', -- dumbbell decline bench press
    '0308', -- dumbbell fly
    '0314', -- dumbbell incline bench press
    '0375', -- dumbbell pullover
    '0493', -- incline push-up
    '0577', -- lever chest press
    '1299', -- lever incline chest press
    '1306', -- plyo push up
    '0662', -- push-up
    '0659', -- push-up (wall)
    '3145', -- push-up plus
    '1473', -- backward jump
    '0026', -- barbell bench squat
    '0028', -- barbell clean and press
    '0068', -- barbell one leg squat
    '0069', -- barbell overhead squat
    '0124', -- barbell wide squat
    '1760', -- dumbbell goblet squat
    '2796', -- dumbbell step-up lunge
    '2133', -- farmers walk
    '1472', -- forward jump
    '0585', -- lever leg extension
    '1489', -- sissy squat
    '0750', -- smith chair squat
    '0768', -- smith single leg split squat
    '2368', -- split squats
    '0786', -- squat jerk
    '3021', -- scapula push-up
    '1010', -- band straight leg deadlift
    '0489', -- hyperextension
    '0573', -- lever back extension
    '1352', -- lower back curl
    '0095', -- barbell shrug
    '0220', -- cable shrug
    '0406', -- dumbbell shrug
    '0548', -- kettlebell sumo high pull
    '3012', -- scapula dips
    '0030', -- barbell close-grip bench press
    '0060', -- barbell lying triceps extension skull crusher
    '0109', -- barbell standing overhead triceps extension
    '0860', -- cable kickback
    '0194', -- cable overhead triceps extension (rope attachment)
    '0201', -- cable pushdown
    '0200', -- cable pushdown (with rope attachment)
    '0283', -- diamond push-up
    '0352', -- dumbbell neutral grip bench press
    '0430', -- dumbbell standing triceps extension
    '3287', -- elbow dips
    '0471', -- handstand push-up
    '1399', -- bench dip on floor
    '0672', -- reverse dip
    '0677', -- ring dips
    '0717', -- side push-up
    '0814', -- triceps dip
    '0816', -- triceps press
    '0027', -- barbell bent over row
    '0049', -- barbell incline row
    '3017', -- barbell pendlay row
    '0861', -- cable seated row
    '0218', -- cable seated wide-grip row
    '1324', -- cable upper row
    '0293', -- dumbbell bent over row
    '0327', -- dumbbell incline row
    '0292', -- dumbbell one arm bent-over row
    '0499', -- inverted row
    '0574', -- lever bent over row
    '0581', -- lever high row
    '0606', -- lever t bar row
    '1773', -- one arm towel row
    '0808' -- suspended row
  );

-- Exercises created directly in SetForge remain available.
UPDATE exercises
SET catalog_visible = TRUE
WHERE source_name IS NULL;

COMMIT;
