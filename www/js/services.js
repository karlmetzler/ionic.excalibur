angular.module('excalibur.services',['angles'])

.factory('Trajectory',function($rootScope){
	return {
		calculate: function(zeroPoint,velocity,arrowWeight,pointWeight,arrowLength,arrowDiameter,fletchLength,fletchHeight){
			var zeroPoint = convertToMetric(zeroPoint,true),
				velocity = convertToMetric(velocity),
				launchAngle = calculateAngleofLaunch(zeroPoint,velocity),
				aw = arrowWeight, // arrow weight
				pw = pointWeight, // point weight
				taw = aw+pw, // total arrow weight
				g = 32.22,
				h = 0.001,
				m = taw/7000/32.22, // arrow mass
				W = taw/7000, //arrow weight
				L = arrowLength,
				R = arrowDiameter/2, // arrow diameter
				D = arrowDiameter,
				lf = fletchLength,
				hf = fletchHeight,
				D2 = D*D,
				F = 6*0.5*lf*hf*1, // total fletch area
				B = 1,
				K1 = 0.0000013, // Point coefficient
				K2 = 0.000000035,
				K3 = 0.000000077,
				Rf1 = (K1*B*D2) + (K2*L*D) + (K3*F),
				Vy = 0,
				Y = 0,
				X = 0,
				V = convertToImperial(velocity),
				Vo = convertToImperial(velocity),
				Vx = Vo,
				Vt = velocity;
				
			var Rf;
			
			function convertToMetric(val,y){
				if(y){ val=val*3;}
				return val * .304800;
			}
			
			function convertToImperial(val){
				return val/.304800;
			}
			
			function calculateTimeToTarget(r,v){
				return r/v;
			}
			
			function calculateAngleofLaunch(r,v){
				x = 9.8*r/(v*v);
				return Math.atan(x/Math.sqrt(1-x*x))*180/(Math.PI*2);
			}
			
			function vyt(v,a,t){
				return v*Math.sin(a*Math.PI/180)-9.8*t;
			}
			
			function yt(v,a,t){
				return v*Math.sin(a*Math.PI/180)*t-.5*9.8*t*t;
			}
			function vxf(v,a){
				return v*Math.cos(a*Math.PI/180);
			}
			function trad(v,y){
				return Math.sqrt(v*v/(9.8*9.8)-2*y/9.8);
			}
			
			function positionAtTime(v,ag,t){
				var pat = new Object();
				 pat.vx = vxf(v,ag); // horizontal velocity
				 pat.x = vxf(v,ag)*t; // horizontal distance
				 pat.vy = vyt(v,ag,t); // vertical velocity
				 pat.y = yt(v,ag,t); // height at time
				 pat.speed = calculateSpeed(convertToImperial(pat.x));
				 
				 return pat;
			}
			
			function totalRangeHeightFlightTime(v,ag){
				h = vyt(v,ag,0) * vyt(v,ag,0)/(2*9.8);
				t = 2 * vyt(v,ag,0)/9.8;
				r = v* v * Math.sin(2 * ag * Math.PI / 180)/9.8;
			}
			
			function calculateSpeed(d){
				var speed = new Object();
				if(d==0){
					speed.v = Math.round(V);
					speed.e = Math.round(0.5*m*V*V);
					return speed;
				} else {
					while(X<d){
						Rf = Rf1*V*V;
						Vx = Vx-h*Rf*Vx/V/m;
						Vy = Vy-h*(g-Rf*Vy/V/m);
						X= X+h*Vx;
						Y=Y+h*Vy;
						V=Math.sqrt((Vx*Vx) + (Vy*Vy));
						speed.v = Math.round(V);
						speed.e = Math.round(0.5*m*V*V);
						Vt = V;
					}
					
					return speed;
				}
			}
			
			var dataseries = [];
			for(var i=0; i<70; i+=10){
				var pat = positionAtTime(velocity,launchAngle,calculateTimeToTarget(convertToMetric(i,true),velocity));
				var data = {
					yardage : i,
					vel: convertToImperial(velocity),
					posAtTime : pat,
					heightAtTime: (convertToImperial(pat.y)*12).toFixed(2),
					drop: (convertToImperial(pat.y)*12).toFixed(2),
					horizontalVelocity: convertToImperial(pat.vx),
					horizontalDistanceMeters: pat.x,
					horizontalDistanceYards: Math.round(convertToImperial(pat.x)/3),
					verticalVelocity: pat.vy,
					arrowSpeed: pat.speed.v,
					kineticEnergy: pat.speed.e 
				};
				
				dataseries.push(data);				
				
				//dataseries[0].push([i,(convertToImperial(foo.y)*12)]);
				//i = i+10;
			}
			//console.log('results',dataseries);
			return dataseries;
		},
		buildChart: function(traj){
			console.log('Trajectory:',traj);
			var lbls = [];
			var drop = [];
			for(var i=0; i < traj.length; i++){
				lbls.push(traj[i].yardage);
				drop.push(traj[i].drop);
			}
			console.log(drop);
			var chart = {
				labels : lbls,
			    datasets : [
			        {
			            fillColor : "rgba(151,187,205,0)",
			            strokeColor : "#e67e22",
			            pointColor : "rgba(151,187,205,0)",
			            pointStrokeColor : "#e67e22",
			            data : drop
			        }
			    ]
			};
			return chart;
		}
	};
})

.factory('$localstorage',['$window', function($window){
	return {
		set: function(key,value){
			$window.localStorage[key] = value;
		},
		get: function(key,defaultValue){
			return $window.localStorage[key] || defaultValue;
		},
		setObject: function(key,value){
			$window.localStorage[key] = JSON.stringify(value);
		},
		getObject: function(key){
			return JSON.parse($window.localStorage[key] || {});
		},
		pushObject: function(key,value){
			var settings = JSON.parse($window.localStorage.getItem(key));
			var config = value;
			settings.push(config);
			
			$window.localStorage.setItem(key, JSON.stringify(settings));
		},
		removeObject: function(key,config,id){
			var settings = JSON.parse($window.localStorage[key]);
			//console.log(settings.length);
			settings.splice(id,1);
			//console.log(settings.length);
			//console.log(settings);
			$window.localStorage.setItem(key, JSON.stringify(settings));
		}
	};
}])

.factory('Chats', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var chats = [{
    id: 0,
    name: 'Ben Sparrow',
    lastText: 'You on your way?',
    face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
  }, {
    id: 1,
    name: 'Max Lynx',
    lastText: 'Hey, it\'s me',
    face: 'https://avatars3.githubusercontent.com/u/11214?v=3&s=460'
  }, {
    id: 2,
    name: 'Adam Bradleyson',
    lastText: 'I should buy a boat',
    face: 'https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg'
  }, {
    id: 3,
    name: 'Perry Governor',
    lastText: 'Look at my mukluks!',
    face: 'https://pbs.twimg.com/profile_images/598205061232103424/3j5HUXMY.png'
  }, {
    id: 4,
    name: 'Mike Harrington',
    lastText: 'This is wicked good ice cream.',
    face: 'https://pbs.twimg.com/profile_images/578237281384841216/R3ae1n61.png'
  }];

  return {
    all: function() {
      return chats;
    },
    remove: function(chat) {
    	console.log(typeof chat);
    	console.log(chat);
      chats.splice(chats.indexOf(chat), 1);
    },
    get: function(chatId) {
      for (var i = 0; i < chats.length; i++) {
        if (chats[i].id === parseInt(chatId)) {
          return chats[i];
        }
      }
      return null;
    }
  };
});
