const express = require('express');
const resumeController = require('../../controllers/resume.controller');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.route('/').post(upload.single('pdf'), resumeController.createResume);
router.route('/').get(resumeController.getResumes);
router.route('/:resumeId').get(resumeController.getResumeById);
router.route('/:resumeId').delete(resumeController.deleteResume);
router.route('/:resumeId').patch(resumeController.updateResumeById);
router.route('/sendtogrowhire/:resumeId').post(resumeController.sendResumeToGrowHire);

module.exports = router;
