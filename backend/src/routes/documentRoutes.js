const express = require('express');
const router = express.Router();
const { getAllDocuments, getDocumentById, createDocument, updateDocument, deleteDocument, uploadDocument } = require('../controllers/documentController');
const { authMiddleware } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.get('/', getAllDocuments);
router.get('/:id', getDocumentById);
router.post('/', authMiddleware, createDocument);
router.post('/upload', authMiddleware, upload.single('file'), uploadDocument);
router.put('/:id', authMiddleware, updateDocument);
router.delete('/:id', authMiddleware, deleteDocument);

module.exports = router;
