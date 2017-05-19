switchAccount = function(ddpClient, userId, loginUserId, callback){
  ddpClient.call('login', [{userId: userId, loginUserId: loginUserId, version: '2.0'}], function(err, res){
    callback && callback(err, res);
  });
};
module.exports = switchAccount;