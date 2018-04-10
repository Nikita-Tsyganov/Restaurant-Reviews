# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

# Project Overview: Stage 3

##How to run the project itself
Please, do not use suggested python server to run my project because it affects the performance dramatically in a bad way.
<br>
I use Windows IIS and recommend you to do the same or to pick any other analogue of your choice.
<br>
Guide for setting up a server with IIS: https://support.microsoft.com/en-us/help/323972/how-to-set-up-your-first-iis-web-site
<br>
Important: use IP address of localhost to set up the server. (127.0.0.1)

##How to run a server for project
Go to:
<br>
https://github.com/udacity/mws-restaurant-stage-3
<br>
Follow instructions

##Project state
I did my best to implement all the required features for stage 3.
<br>
Having Google Maps in page load made it impossible to achieve performance score higher than 90.
<br>
So my solution was to remove it from page completely and only show when requested by user.
<br>
Note: minifying files proved to has little to no impact on performance, but provides additional headaches, so I decided not to go for it.

##My Lighthouse results running project on IIS server
index.html: https://ibb.co/cwLXZx
<br>
restaurant.html: https://ibb.co/jV3mux

