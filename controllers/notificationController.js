const Notification = require("../models/notificationModel");

const getallnotifs = async (req, res) => {
  try {
    const {userId}=req.user;
    const notifs = await Notification.find({userId});
    return res.send(notifs);
  } catch (error) {
    res.status(500).send("Unable to get all notifications");
  }
};

module.exports = {
  getallnotifs,
};
