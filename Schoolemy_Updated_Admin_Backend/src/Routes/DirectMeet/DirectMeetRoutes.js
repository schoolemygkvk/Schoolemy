
import express from 'express';

const router = express.Router();

const GONE_BODY = {
  error: 'GONE',
  message:
    'The legacy /api/direct-meets API has been retired. Use /api/course-meets for course-linked meets (create-meet, meets, attendance, materials, etc.).',
  canonicalBase: '/api/course-meets',
};

router.use((req, res) => {
  res
    .status(410)
    .set('Deprecation', 'true')
    .set('Link', '</api/course-meets>; rel="successor-version"')
    .json(GONE_BODY);
});

export default router;
