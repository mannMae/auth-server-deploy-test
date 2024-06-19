module.exports = {
  apps: [
    {
      name: "auth-server",
      script: "babel-node src/init.js",
      autorestart: true,
      //   instance: 0,
      //   exec_mode: "cluster",
    },
  ],
};
