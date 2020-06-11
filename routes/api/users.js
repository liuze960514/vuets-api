// @login & addUser
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const keys = require('../../config/keys');
const passport = require('passport');

const nodemailer = require('nodemailer');
require('dotenv').config();

const User = require('../../models/User');

// @route  GET api/users/test
// @desc   返回的请求的json数据
// @access public
router.get('/test', (req, res) => {
  res.json({ msg: 'login works' });
});

// @route  POST api/users/addUser
// @desc   返回的添加成功的json数据
// @access public
router.post(
  '/addUser',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    User.find().then(users => {
      if (users.length <= 10) {
        // 查询数据库中是否拥有邮箱
        User.findOne({ username: req.body.username }).then(user => {
          if (user) {
            return res.status(400).json('用户名已被注册!');
          } else {
            const avatar = gravatar.url(req.body.username, {
              s: '200',
              r: 'pg',
              d: 'mm'
            });

            let des = '';
            let role = '';

            if (req.body.key == 'admin') {
              des = 'Super Administrator. Have access to view all pages.';
              role = '管理员';
            } else if (req.body.key == 'editor') {
              des = 'Normal Editor. Can see all pages except permission page';
              role = '客服';
            } else if (req.body.key == 'visitor') {
              des =
                'Just a visitor. Can only see the home page and the document page';
              role = '游客';
            }

            const newUser = new User({
              username: req.body.username,
              pwd: '123456',
              avatar,
              key: req.body.key,
              role,
              des
            });

            newUser
              .save()
              .then(user =>
                res.status(200).json({
                  state: 'suc',
                  msg: '添加用户成功',
                  datas: newUser
                })
              )
              .catch(err => console.log(err));
          }
        });
      } else {
        res.status(400).json('最多能添加10个用户');
      }
    });
  }
);

// @route  POST api/users/login
// @desc   返回token jwt passport
// @access public

router.post('/login', (req, res) => {
  const username = req.body.username;
  const pwd = req.body.pwd;
  const autoLogin = req.body.autoLogin;
  // 查询数据库
  User.findOne({ username }).then(user => {
    if (!user) {
      return res.status(400).json({
        state: 'failed',
        msg: '用户不存在!'
      });
    }
    if (user.username == 'admin' && pwd == '123456') {
      const rule = {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        key: user.key
      };

      jwt.sign(
        rule,
        keys.secretOrKey,
        { expiresIn: autoLogin ? 604800 : 3600 },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({
            state: 'suc',
            msg: '登录成功',
            token: 'Bearer ' + token
          });
        }
      );
    } else {
      // 密码匹配
      if (pwd == user.pwd) {
        const rule = {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          key: user.key
        };
        jwt.sign(
          rule,
          keys.secretOrKey,
          { expiresIn: autoLogin ? 604800 : 3600 },
          (err, token) => {
            if (err) throw err;
            res.json({
              state: 'suc',
              msg: '登录成功',
              token: 'Bearer ' + token
            });
          }
        );
      } else {
        return res.status(400).json({
          state: 'failed',
          msg: '密码错误!'
        });
      }
    }
  });
});

// @route  POST api/users//editUser/:id
// @desc   返回的编辑好的json数据
// @access private
router.post(
  '/editUser/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const userFields = {};

    if (req.body.username) userFields.username = req.body.username;
    if (req.body.pwd) userFields.pwd = req.body.pwd;
    if (req.body.key == 'admin') {
      userFields.des = 'Super Administrator. Have access to view all pages.';
      userFields.role = '管理员';
    } else if (req.body.key == 'editor') {
      userFields.des =
        'Normal Editor. Can see all pages except permission page';
      userFields.role = '客服';
    } else if (req.body.key == 'visitor') {
      userFields.des =
        'Just a visitor. Can only see the home page and the document page';
      userFields.role = '游客';
    }

    if (req.body.key) userFields.key = req.body.key;

    User.findOneAndUpdate(
      { _id: req.params.id },
      { $set: userFields },
      { new: true }
    ).then(() =>
      res.status(200).json({
        state: 'suc',
        msg: '编辑用户成功'
      })
    );
  }
);

// @route  GET api/users/allUsers
// @desc   获取所有用户信息
// @access private

router.get(
  '/allUsers',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    User.find()
      .then(users => {
        if (!users) {
          return res.status(400).json({
            state: 'failed',
            msg: '没有任何用户信息'
          });
        }
        res.status(200).json({
          state: 'suc',
          msg: '成功获取所有用户信息',
          total: users.length,
          datas: users
        });
      })
      .catch(err => res.status(400).json(err));
  }
);

// @route  POST api/users/deleteUser/:id
// @desc   删除信息接口
// @access Private
router.delete(
  '/deleteUser/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    User.findById({ _id: req.params.id }).then(user => {
      if (user.username == 'admin') {
        res.status(400).json({
          state: 'failed',
          msg: 'admin超级管理员无法删除'
        });
      } else {
        User.findOneAndRemove({ _id: req.params.id })
          .then(user => {
            user.save().then(user =>
              res.status(200).json({
                state: 'suc',
                msg: '删除用户成功'
              })
            );
          })
          .catch(err =>
            res.status(400).json({
              state: 'failed',
              msg: '删除失败!'
            })
          );
      }
    });
  }
);

// @route  POST api/users/changePwd
// @desc   返回修改密码成功
// @access public
router.post(
  '/changePwd',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    User.findOne({ username: req.body.username }).then(user => {
      if (!user) {
        res.status(400).json({
          state: 'failed',
          msg: '该用户不存在'
        });
      } else {
        const newUser = {
          username: req.body.username ? req.body.username : user.username,
          pwd: req.body.pwd ? req.body.pwd : '123456',
          avatar: req.body.avatar ? req.body.avatar : user.avatar,
          key: req.body.key ? req.body.key : user.key,
          role: req.body.role ? req.body.role : user.role,
          des: req.body.des ? req.body.des : user.des
        };

        User.findOneAndUpdate(
          { _id: user._id },
          { $set: newUser },
          { new: true }
        ).then(() =>
          res.status(200).json({
            state: 'suc',
            msg: '密码修改成功'
          })
        );
      }
    });
  }
);

// @route  POST api/users/findPwd
// @desc   找回密码成功
// @access public
router.post('/findPwd', (req, res) => {
  User.findOne({ username: req.body.username }).then(user => {
    if (!user) {
      res.status(400).json({
        state: 'failed',
        msg: '该用户不存在'
      });
    } else {
      // step1
      let transporter = nodemailer.createTransport({
        host: 'smtp.qq.com',
        port: 465,
        // service: 'qq',
        secure: true,
        auth: {
          // user: process.env.EMAIL,
          // pass: process.env.PASSWORD
          user: '309595700@qq.com',
          pass: 'zlwzpmabwymvcaib'
        }
      });

      // step2
      let mailOptions = {
        from: '309595700@qq.com',
        to: req.body.email,
        subject: '密码找回',
        text: `您的账号是${user.username},密码是: ${user.pwd}`
      };

      // step3
      transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
          res.status(400).json(err);
        } else {
          res.status(200).json({
            state: 'suc',
            msg: `密码已发送至您的${req.body.email}邮箱`
          });
        }
      });
    }
  });
});

module.exports = router;
