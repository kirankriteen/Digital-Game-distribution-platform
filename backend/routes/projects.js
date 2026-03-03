const express = require('express')
const router = express.Router()
const { projects } = require('../data')
const { authenticateToken, setUser } = require('../middleware/auth')
const { canViewProject, scopedProjects, canDeleteProject } = require('../permissions/project')

router.get('/', authenticateToken, setUser, (req, res) => {
  res.json(scopedProjects(req.user, projects))
})

router.get('/me', authenticateToken, setUser, (req, res) => {
    res.json(projects.filter(p => p.userId === req.user.id))
})

module.exports = router