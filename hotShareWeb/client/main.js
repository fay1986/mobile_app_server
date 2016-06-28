if (Meteor.isClient) {
  Session.set("DocumentTitle",'Storyboard');
  Deps.autorun(function(){
    document.title = Session.get("DocumentTitle");
  });
}