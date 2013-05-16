/* Copyright (c) 2013 Richard Rodger, MIT License */
"use strict";


var _              = require('underscore')
var emailtemplates = require('email-templates')
var nodemailer     = require("nodemailer");

var name = "mail"





module.exports = function( options, register ){
  var seneca = this

  options = this.util.deepextend({
    folder:    './email-templates',
    content:   {},
    mail:      {},
    transport: 'smtp',
    config: {}
  },options)




  
  seneca.add({role:name,cmd:'generate'},function( args, done ){
    var code     = args.code // template identifier 

    this.act({role:name,hook:'content',
              code:args.code,
              content:_.extend({},options.content,options.content[code]||{},args.content)},function(err,content){
      if( err) return done(err)

      template( code, content, function(err,html,text){
        done( err, {ok:!err, html:html, text:text} )
      })
    })
  })


  seneca.add({role:name,cmd:'send'},function( args, done ){
    var seneca = this

    if( args.code ) {
      seneca.act({role:name,cmd:'generate',code:args.code,content:args.content},function(err,out){
        if( err) return done(err)
        do_send(out)
      })
    }
    else do_send({html:args.html,text:args.text})


    function do_send(body) {
      var sendargs = _.extend({},options.mail,args,{cmd:null,hook:'send',text:body.text,html:body.html})
      seneca.act(sendargs,done)
    }
  })


  seneca.add({role:name,hook:'content'},function( args, done ){
    var code   = args.code // template identifier 

    var content = this.util.deepextend({},options.content[code]||{},args.content||{})
    done( null, content )
  })



  seneca.add({role:name,hook:'send'},function( args, done ){

    transport.sendMail(args, function(err, response){
      if( err ) return done(err);
      done(null,{ok:true,details:response})
    })
  })



  var template
  var transport


  seneca.add({role:name,hook:'init',sub:'templates'},function( args, done ){
    var options = args.options
    emailtemplates( options.folder, function( err, templateinstance ) {
      if( err ) return done(err);

      template = templateinstance
      done(null,template)
    })
  })


  seneca.add({role:name,hook:'init',sub:'transport'},function( args, done ){
    var options = args.options
    transport = nodemailer.createTransport( options.transport, options.config )    
    done(null,transport)
  })


  seneca.add({role:name,hook:'init'},function( args, done ){
    seneca.act({role:name,hook:'init',sub:'templates',options:options},function( err ){
      if( err ) return done(err);

      seneca.act({role:name,hook:'init',sub:'transport',options:options},function( err ){
        if( err ) return done(err);

        done(null)
      })
    })
  })


  

  seneca.act( {role:name,hook:'init',transport:options.transport,config:options.config}, function(err) {
    register(err,{
      name:name
    })
  })
}
