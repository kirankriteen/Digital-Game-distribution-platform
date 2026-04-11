const { User, Group, Message } = require("../db/models");
const { authenticateToken, authenticateRole } = require("../middleware/auth");
const { ROLE } = require("../data");
const { pool } = require("../db/pool");

const router = express.Router();
router.use(express.json());

router.post(
  "/check-user",
  authenticateToken,
  authenticateRole([ROLE.USER, ROLE.DEVELOPER]),
  async (req, res) => {
    try {
      const user_id = req.user.id;
      const username = req.body.username;
      if (!username) {
        res.status(404).json({ error: "username not provided" });
      }

      const existingById = await User.findOne({ user_id });
      if (existingById) {
        return res
          .status(400)
          .json({ error: "User with this user_id already exists" });
      }

      const existingByUsername = await User.findOne({ username });
      if (existingByUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }
      return res.status(200).json({ message: "User is not there" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.post(
  "/add-user",
  authenticateToken,
  authenticateRole([ROLE.USER, ROLE.DEVELOPER]),
  async (req, res) => {
    try {
      const user_id = req.user.id;
      const username = req.body.username;
      if (!username) {
        res.status(404).json({ error: "username not provided" });
      }

      const existingById = await User.findOne({ user_id });
      if (existingById) {
        return res
          .status(400)
          .json({ error: "User with this user_id already exists" });
      }

      const existingByUsername = await User.findOne({ username });
      if (existingByUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      const newUser = new User({
        user_id,
        username,
        avatar: null,
        status: "offline",
      });

      await newUser.save();

      return res
        .status(201)
        .json({ message: "User added successfully", user: newUser });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.post(
  "/create-user-group",
  authenticateToken,
  authenticateRole([ROLE.DEVELOPER, ROLE.USER]),
  async (req, res) => {
    try {
      const user_id = req.user.id;
      const group = req.body.group;
      if (!group) {
        res.status(404).json({ error: "group not provided" });
      }

      const existingGroup = await Group.findOne({ name: group });
      if (existingGroup) {
        return res.status(400).json({ error: "Group name already taken" });
      }

      const user = await User.findOne({ user_id });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const newGroup = new Group({
        name: group,
        members: [user._id],
        avatar: null,
      });
      await newGroup.save();

      return res
        .status(201)
        .json({ message: "Group created successfully", group: newGroup });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.post(
  "/join-user-group",
  authenticateToken,
  authenticateRole([ROLE.USER, ROLE.DEVELOPER]),
  async (req, res) => {
    try {
      const user_id = req.user.id;
      const groupId = req.body.groupId;

      if (!groupId) {
        return res.status(400).json({ error: "Group ID not provided" });
      }

      const user = await User.findOne({ user_id });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      if (group.members.includes(user._id)) {
        return res
          .status(400)
          .json({ error: "User already a member of this group" });
      }

      group.members.push(user._id);
      await group.save();

      // Can emit here that the user has joined

      return res
        .status(200)
        .json({ message: "Joined group successfully", group });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.post(
  "/get-user-messages",
  authenticateToken,
  authenticateRole([ROLE.USER, ROLE.DEVELOPER]),
  async (req, res) => {
    try {
      const user_id = req.user.id;
      const { groupId, beforeMessageId, limit = 20 } = req.body;

      const user = await User.findOne({ user_id });
      if (!user) return res.status(404).json({ error: "User not found" });

      const group = await Group.findOne({ _id: groupId, members: user._id });
      if (!group)
        return res
          .status(403)
          .json({ error: "You are not a member of this group" });

      const query = { group: groupId };
      let messagesQuery = Message.find(query)
        .populate("sender", "username user_id")
        .populate("group", "name");
      if (beforeMessageId && limit) {
        const beforeMessage = await Message.findById(beforeMessageId);

        if (beforeMessage) {
          query.createdAt = { $lt: beforeMessage.createdAt };
        }

        messagesQuery = Message.find(query)
          .sort({ createdAt: -1 })
          .limit(parseInt(limit))
          .populate("sender", "username user_id")
          .populate("group", "name");
      } else {
        // 👉 No pagination: return all messages sorted
        messagesQuery = Message.find(query)
          .sort({ createdAt: -1 })
          .populate("sender", "username user_id")
          .populate("group", "name");
      }

      const messages = await messagesQuery;

      return res.json({
        messages,
        paginated: !!(beforeMessageId && limit),
        limit: limit || null,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Server Error" });
    }
  },
);

router.post(
  "/get-user-groups",
  authenticateToken,
  authenticateRole([ROLE.USER, ROLE.DEVELOPER]),
  async (req, res) => {
    try {
      const groups = await Group.find({ type: "user" })
        .populate("members", "username avatar status")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        groups,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Server Error" });
    }
  },
);

module.exports = router;
