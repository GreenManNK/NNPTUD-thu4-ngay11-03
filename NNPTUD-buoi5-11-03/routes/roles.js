var express = require('express');
var router = express.Router();
let mongoose = require('mongoose');
let roleModel = require('../schemas/roles');
let userModel = require('../schemas/users');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function getActiveRoleById(id) {
  return roleModel.findOne({
    _id: id,
    isDeleted: false
  });
}

router.get('/', async function (req, res, next) {
  let roles = await roleModel.find({
    isDeleted: false
  });
  res.send(roles);
});

router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    if (!isValidObjectId(id)) {
      return res.status(404).send({
        message: 'ID NOT FOUND'
      });
    }

    let result = await getActiveRoleById(id);
    if (!result) {
      return res.status(404).send({
        message: 'ID NOT FOUND'
      });
    }

    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/:id/users', async function (req, res, next) {
  try {
    let id = req.params.id;
    if (!isValidObjectId(id)) {
      return res.status(404).send({
        message: 'ID NOT FOUND'
      });
    }

    let role = await getActiveRoleById(id);
    if (!role) {
      return res.status(404).send({
        message: 'ID NOT FOUND'
      });
    }

    let users = await userModel.find({
      role: id,
      isDeleted: false
    }).populate({
      path: 'role',
      select: 'name description'
    });

    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/', async function (req, res, next) {
  try {
    let newRole = new roleModel({
      name: req.body.name,
      description: req.body.description
    });

    await newRole.save();
    res.send(newRole);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.put('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    if (!isValidObjectId(id)) {
      return res.status(404).send({
        message: 'ID NOT FOUND'
      });
    }

    let role = await getActiveRoleById(id);
    if (!role) {
      return res.status(404).send({
        message: 'ID NOT FOUND'
      });
    }

    let keys = ['name', 'description'];
    for (const key of keys) {
      if (req.body[key] !== undefined) {
        role[key] = req.body[key];
      }
    }

    await role.save();
    res.send(role);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    if (!isValidObjectId(id)) {
      return res.status(404).send({
        message: 'ID NOT FOUND'
      });
    }

    let role = await getActiveRoleById(id);
    if (!role) {
      return res.status(404).send({
        message: 'ID NOT FOUND'
      });
    }

    role.isDeleted = true;
    await role.save();
    res.send(role);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
