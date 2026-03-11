var express = require('express');
var router = express.Router();
let mongoose = require('mongoose');
let userModel = require('../schemas/users');
let roleModel = require('../schemas/roles');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function getActiveUserById(id) {
  return userModel.findOne({
    _id: id,
    isDeleted: false
  }).populate({
    path: 'role',
    select: 'name description',
    match: {
      isDeleted: false
    }
  });
}

async function getActiveRoleById(id) {
  return roleModel.findOne({
    _id: id,
    isDeleted: false
  });
}

function pickDefinedFields(source, keys) {
  let result = {};
  for (const key of keys) {
    if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

router.get('/', async function (req, res, next) {
  try {
    let users = await userModel.find({
      isDeleted: false
    }).populate({
      path: 'role',
      select: 'name description',
      match: {
        isDeleted: false
      }
    });
    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    if (!isValidObjectId(id)) {
      return res.status(404).send({
        message: 'ID NOT FOUND'
      });
    }

    let result = await getActiveUserById(id);
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

router.post('/', async function (req, res, next) {
  try {
    if (req.body.role !== undefined && req.body.role !== null) {
      if (!isValidObjectId(req.body.role)) {
        return res.status(400).send({
          message: 'ROLE ID INVALID'
        });
      }

      let role = await getActiveRoleById(req.body.role);
      if (!role) {
        return res.status(400).send({
          message: 'ROLE NOT FOUND'
        });
      }
    }

    let newUser = new userModel({
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
      ...pickDefinedFields(req.body, ['fullName', 'avatarUrl', 'status', 'role', 'loginCount'])
    });

    await newUser.save();
    let result = await getActiveUserById(newUser._id);
    res.send(result);
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

    let user = await userModel.findOne({
      _id: id,
      isDeleted: false
    });
    if (!user) {
      return res.status(404).send({
        message: 'ID NOT FOUND'
      });
    }

    if (req.body.role !== undefined && req.body.role !== null) {
      if (!isValidObjectId(req.body.role)) {
        return res.status(400).send({
          message: 'ROLE ID INVALID'
        });
      }

      let role = await getActiveRoleById(req.body.role);
      if (!role) {
        return res.status(400).send({
          message: 'ROLE NOT FOUND'
        });
      }
    }

    let keys = ['username', 'password', 'email', 'fullName', 'avatarUrl', 'status', 'role', 'loginCount'];
    for (const key of keys) {
      if (req.body[key] !== undefined) {
        user[key] = req.body[key];
      }
    }

    await user.save();
    let result = await getActiveUserById(user._id);
    res.send(result);
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

    let user = await userModel.findOne({
      _id: id,
      isDeleted: false
    });
    if (!user) {
      return res.status(404).send({
        message: 'ID NOT FOUND'
      });
    }

    user.isDeleted = true;
    await user.save();
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/enable', async function (req, res, next) {
  try {
    let email = req.body.email;
    let username = req.body.username;

    if (!email || !username) {
      return res.status(400).send({
        message: 'EMAIL AND USERNAME ARE REQUIRED'
      });
    }

    let user = await userModel.findOne({
      email: email,
      username: username,
      isDeleted: false
    });

    if (!user) {
      return res.status(404).send({
        message: 'USER NOT FOUND'
      });
    }

    user.status = true;
    await user.save();
    let result = await getActiveUserById(user._id);
    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/disable', async function (req, res, next) {
  try {
    let email = req.body.email;
    let username = req.body.username;

    if (!email || !username) {
      return res.status(400).send({
        message: 'EMAIL AND USERNAME ARE REQUIRED'
      });
    }

    let user = await userModel.findOne({
      email: email,
      username: username,
      isDeleted: false
    });

    if (!user) {
      return res.status(404).send({
        message: 'USER NOT FOUND'
      });
    }

    user.status = false;
    await user.save();
    let result = await getActiveUserById(user._id);
    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
