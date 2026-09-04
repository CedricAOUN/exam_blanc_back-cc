const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');

/**
 * Gets all tasks belonging to the authenticated user.
 * @route GET /api/tasks
 * @auth Required
 */
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * Creates a task for the authenticated user.
 * @route POST /api/tasks
 * @auth Required
 */
router.post('/', auth, async (req, res) => {
  const { 
    title,
    // description - Non-utilise pour le moment dans le frontend.
  } = req.body;

  // Un utilisateur pourrait injecter du HTML ou du script dans la description.
  // Ceci n'est pas un probleme pour le moment, sachant que React escape le HTML/Script par defaut.
  // Cela devient un problem uniquement a l'usage de dangerouslySetInnerHTML, mais ce n'est jamais le cas en frontend.
  // Un solution a ete mise en place tout de meme pour prevenir la soumission de HTML/Script dans le titre.
  try {
    const newTask = new Task({
      title,
      // description - Non-utilise pour le moment dans le frontend.
      user: req.user.id,
    });

    // Prevenir la soumission d'un titre vide.
    if (!title || title.trim() === "") {
      return res.status(400).json({ msg: 'Title is required' });
    }

    // Prevenir la soumission de HTML/Script quand meme.
    if (/<[a-z][\s\S]*>/i.test(title)) {
      return res.status(400).json({ msg: 'HTML/Script is not allowed in the title' });
    }

    const task = await newTask.save();
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * Updates a task belonging to the authenticated user.
 * @route PUT /api/tasks/:id
 * @auth Required
 */
router.put('/:id', auth, async (req, res) => {
  const { title, description, isCompleted } = req.body;
  
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    const currentUserId = req.user.id; // ID de l'utilisateur actuel
    // Vérification pour s'assurer que la tâche appartient bien à l'utilisateur qui fait la requête.
    if(currentUserId !== task.user.toString()) {
      return res.status(401).json({ msg: 'You do not own this task' });
    }

    if (!title || title.trim() === "") {
      return res.status(400).json({ msg: 'Title cannot be empty' });
    }

    task = await Task.findByIdAndUpdate(req.params.id, { $set: { title, description, isCompleted } }, { new: true });
    
    // Ici c'est corrigé, mais c'est un bug courant à surveiller.
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * Deletes a task belonging to the authenticated user.
 * @route DELETE /api/tasks/:id
 * @auth Required
 */
// Un utilisateur peut supprimer les tâches des autres.
router.delete('/:id', auth, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    const currentUserId = req.user.id; // ID de l'utilisateur actuel
    // Vérification pour s'assurer que la tâche appartient bien à l'utilisateur qui fait la requête.
    if(currentUserId !== task.user.toString()) {
      return res.status(401).json({ msg: 'You do not own this task' });
    }

    await Task.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Task removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
