Template.seriesList.rendered=->
  $('.content').css 'min-height',$(window).height()
  if Session.get('followSeriesScrollTop') and Session.get('followSeriesScrollTop')>0
    $(document).scrollTop(Session.get('followSeriesScrollTop'))
    Session.set('followSeriesScrollTop',0)
  $(window).scroll (event)->
      target = $("#showMoreResults");
      FOLLOW_SERIES_INCREMENT = 6;
      if (!target.length)
          return;
      threshold = $(window).scrollTop() + $(window).height() - target.height();
      if target.offset().top < threshold
          if (!target.data("visible"))
              target.data("visible", true);
              Session.set("followSeriesLimit", Session.get("followSeriesLimit") + FOLLOW_SERIES_INCREMENT);
      else
          if (target.data("visible"))
              target.data("visible", false);
Template.seriesList.helpers
  noSeries:()->
    !(SeriesFollow.find().count() > 0)
  mySeries:()->
    # mySeries = Series.find({owner:Meteor.userId(),publish:{"$ne":false}}, {sort: {createdAt: -1}})
    mySeries = SeriesFollow.find({owner:Meteor.userId()}, {sort: {createdAt: -1}})
    Session.setPersistent('persistentFollowSeries', mySeries.fetch())
    return mySeries
  isfollowerSeries:(seriesId)->
    if SeriesFollow.find({seriesId:seriesId}).count() > 1 and seriesId isnt null
      seriesFollowId = SeriesFollow.findOne({seriesId: seriesId})._id
      SeriesFollow.remove({_id:seriesFollowId})
      mySeries = SeriesFollow.find({owner:Meteor.userId()}, {sort: {createdAt: -1}})
      Session.setPersistent('persistentFollowSeries',mySeries.fetch())
      return true
    else
      return true
  moreResults:->
    !(SeriesFollow.find().count() < Session.get("followSeriesLimit"))
  loading:->
    Session.equals('followSeriesCollection','loading')
  loadError:->
    Session.equals('followSeriesCollection','error')
  showSeriesHint:->
    return !localStorage.getItem('seriesHint') and Series.find({owner:Meteor.userId()}).count() is 0
Template.seriesList.events
    'click .top-home-btn': (event)->
      Router.go '/'
    'click #follow': (event)->
      Router.go '/searchFollow'
    'click .clickHelp':(event)->
      PUB.page '/help'
    'click .seriesImages ul li':(e)->
      seriesId = e.currentTarget.id
      Session.set('isSeriesEdit',false)
      Session.set('followSeriesScrollTop',$(document).scrollTop())
      Session.set('seriesFromPage','/seriesList')
      # Router.go '/series/' + seriesId
      history = Session.get('history_view') || []
      history.push({
        view: 'seriesList'
      })
      Session.set('history_view',history)
      PUB.page('/series/' + seriesId)
Template.seriesFooter.helpers
  haveSeries:()->
    Series.find({owner:Meteor.userId()}).count() > 0
Template.seriesFooter.events
    'click #user':(e)->
      Session.set('followSeriesScrollTop',$(document).scrollTop())
      $(document).scrollTop(0)
      Session.set('seriesFromPage','/seriesList')
      PUB.page('/mySeries')
    'click #album-select':(e)->
      Session.set('followSeriesScrollTop',$(document).scrollTop())
      Session.set('seriesFromPage','/seriesList')
      Meteor.defer ()->
        $('.modal-backdrop.in').remove()
      Session.set('isSeriesEdit',true)
      PUB.page '/series'
      Meteor.defer ()->
        selectMediaFromAblum 1, (cancel, result)->
          if cancel
            PUB.back()
            return
          if result
            TempDrafts.insert {type:'image',isSeriesImg:true, isImage:true, owner: Meteor.userId(), imgUrl:result.smallImage, filename:result.filename, URI:result.URI, layout:''}
            data = TempDrafts.find({isSeriesImg:true}).fetch()
            Session.set('seriesContent',{imageData:data, postLists: [],publish: false})
            TempDrafts.remove({})
    'click #photo-select':(e)->
      Session.set('followSeriesScrollTop',$(document).scrollTop())
      Session.set('seriesFromPage','/seriesList')
      Meteor.defer ()->
        $('.modal-backdrop.in').remove()
      Session.set('isSeriesEdit',true)
      PUB.page '/series'
      Meteor.defer ()->
        if window.takePhoto
          window.takePhoto (result)->
            # console.log 'result from camera is ' + JSON.stringify(result)
            if result
              TempDrafts.insert {type:'image',isSeriesImg:true, isImage:true, owner: Meteor.userId(), imgUrl:result.smallImage, filename:result.filename, URI:result.URI, layout:''}
              data = TempDrafts.find({isSeriesImg:true}).fetch()
              Session.set('seriesContent',{imageData:data, postLists: [],publish: false})
              TempDrafts.remove({})
            else
              PUB.back()