server_domain_name = (typeof process !== "undefined" && process !== null ? process.env.SERVER_DOMAIN_NAME : void 0) || "cdn.tiegushi.com";
if (withZhiFaCDN) {
  server_domain_name = "cdcdn.tiegushi.com:8080";
}
chat_server_url = 'chat.cdn.tiegushi.com';
sign_server_url = 'http://sign.tiegushi.com:8080/sign/';
//import_server_url = 'urlanalyser.tiegushi.com';
import_server_url = 'http://urlanalyser.tiegushi.com:8080/import';
import_cancel_url = 'http://urlanalyser.tiegushi.com:8080/import-cancel';
IMPORT_SERVER_PORT = 8080;
ddp_alter_url = (typeof process !== "undefined" && process !== null ? process.env.DDP_ALTER_URL : void 0) || 'ws://localhost:5000/websocket';
// import_server_url = 'http://192.168.1.84:8080/import';
// import_cancel_url = 'http://192.168.1.84:8080/import-cancel';
rest_api_url = "http://"+server_domain_name;
review_post_url = "http://"+server_domain_name + '/restapi/postInsertHook/';
//review_post_url = 'http://192.168.1.65:5000/restapi/postInsertHook/';
theme_host_url = 'http://cdcdn.tiegushi.com';
version_host_url = 'http://data.tiegushi.com/versions/version.json?t='+(Date.now());