angular.module('excalibur.controllers', ['ngCordova','angles'])

.controller('SetupCtrl',function($scope,$rootScope,$http,$q,$location,$localstorage,Trajectory){
	$scope.init = function(){
		// set an empty object for localstorage...
		//$localstorage.setObject('xcal_config',[]);
		$scope.getEquipment()
			.then(function(res){
				$scope.bows = res.crossbows;
				$scope.arrows  = res.arrows; 
				//console.log($scope.bows);
				//console.log($scope.arrows);
			},function(status){
				$scope.pageError = status;
				console.log(status);
			});
	};
	
	$scope.getEquipment = function(){
		var defer = $q.defer();
		$http.jsonp('http://teambackwoods.com/api/equipment/format/json?callback=JSON_CALLBACK')
			.success(function(res){
				defer.resolve(res);
			}).error(function(status,err){
				defer.reject(status);
			});
		return defer.promise;
	};
	
	$scope.init();
	
	$scope.saveSetup = function(setup){
		var bow = $scope.bows[setup.bow];
		var arrow = $scope.arrows[setup.arrow];
		var point = setup.point;
		var totalArrowWeight = parseInt(arrow.weight) + parseInt(point);
		
		$scope.getAdjustedVelocity(bow.velocity,totalArrowWeight)
			.then(function(res){
				$scope.adjustedVelocity = res;
				var configuration = {
					bow_id: bow.id,
					bow_name: bow.name,
					velocity: bow.velocity,
					powerstroke: bow.power_stroke,
					draw_weight: bow.draw_weight,
					min_arrow_length: bow.arrow_length,
					min_arrow_weight: bow.min_arrow_weight,
					arrow_id: arrow.id,
					arrow_name: arrow.arrow_name,
					diameter: arrow.diameter,
					fletch_height: arrow.fletch_height,
					fletch_length: arrow.fletch_length,
					arrow_length: arrow.length,
					arrow_weight: arrow.weight,
					point_weight: point,
					total_arrow_weight: $scope.adjustedVelocity.arrow_weight,
					adjusted_velocity: $scope.adjustedVelocity.adjusted_velocity
				};
			console.log(configuration);
			if(window.localStorage['xcal_config']){
				$localstorage.pushObject('xcal_config',configuration);
			}else{
				$localstorage.setObject('xcal_config',configuration);
			}
			$scope.trajectory = Trajectory.calculate(20,parseInt($scope.adjustedVelocity.adjusted_velocity),parseInt(arrow.weight),parseInt(point),parseInt(arrow.length),parseFloat(arrow.diameter),parseInt(arrow.fletch_length),parseInt(arrow.fletch_height));
			console.log($scope.trajectory);
			
			$rootScope.baseConfig = configuration;
			$rootScope.configurations = $localstorage.getObject('xcal_config');
			
			$location.path('/tab/dash');
			
			},function(status){
				$scope.pageError = status;
				console.log(status);
			});
	};
	
	$scope.getAdjustedVelocity = function(vel,weight){
		var defer = $q.defer();
		$http.jsonp('http://teambackwoods.com/api/bowspeed/velocity/'+vel+'/arrow_weight/'+weight+'/format/json?callback=JSON_CALLBACK')
			.success(function(res){
				defer.resolve(res);
			})
			.error(function(status,err){
				defer.reject(status);
			});
		return defer.promise;
	};
})


.controller('AppCtrl', function($scope,$location,$ionicHistory,$rootScope,$http,$q,$ionicModal,Trajectory,$localstorage) {
	
	if(!window.localStorage['xcal_config']){
		console.log('No configurations found...');
		$ionicHistory.nextViewOptions({
			disableAnimate: true,
			disableBack: true
		});
		$location.path('setup');
	}
	
	$scope.init = function(){
		$scope.configurations = $localstorage.getObject('xcal_config');
		
		$scope.getEquipment()
			.then(function(res){
				//console.log('getEquipment called');
				$scope.bows = res.crossbows;
				$scope.arrows = res.arrows;
				
			},function(status){
				$scope.pageError = status;
				console.log(status);
		});
	};
	
	$scope.getEquipment = function(){
		var defer = $q.defer();
		$http.jsonp('http://teambackwoods.com/api/equipment/format/json?callback=JSON_CALLBACK')
			.success(function(res){
				defer.resolve(res);
			})
			.error(function(status,err){
				defer.reject(status);
			});
		return defer.promise;
	};
	
	$scope.saveSetup = function(setup){
		var bow = $scope.bows[setup.bow];
		var arrow = $scope.arrows[setup.arrow];
		var point = setup.point;
		var totalArrowWeight = parseInt(arrow.weight) + parseInt(point);
		
		/*
		 * get adjusted FPS from the API
		 * save the setup to local storage
		 * 
		 */
		
		$scope.getAdjustedVelocity(bow.velocity,totalArrowWeight)
			.then(function(res){
				$scope.adjustedVelocity = res;
								
				// save to local storage and continue...
				
				var configuration = {
					bow_id : bow.id,
					bow_name: bow.name,
					velocity: bow.velocity,
					powerstroke: bow.power_stroke,
					draw_weight: bow.draw_weight,
					min_arrow_length: bow.arrow_length,
					min_arrow_weight: bow.min_arrow_weight,
					arrow_id: arrow.id,
					arrow_name: arrow.arrow_name,
					diameter: arrow.diameter,
					fletch_height: arrow.fletch_height,
					fletch_length: arrow.fletch_length,
					arrow_length: arrow.length,
					arrow_weight: arrow.weight,
					point_weight: point,
					total_arrow_weight: $scope.adjustedVelocity.arrow_weight,
					adjusted_velocity: $scope.adjustedVelocity.adjusted_velocity
				};
				
				if(window.localStorage['xcal_config']){
					$localstorage.pushObject('xcal_config',configuration);
				} else {
					$localstorage.setObject('xcal_config',configuration);
				}
				
				
				
				$scope.trajectory = Trajectory.calculate(20,parseInt($scope.adjustedVelocity.adjusted_velocity),parseInt(arrow.weight),parseInt(point),parseInt(arrow.length),parseFloat(arrow.diameter),parseInt(arrow.fletch_length),parseInt(arrow.fletch_height));
				console.log('trajectory',$scope.trajectory);
				
				$scope.baseConfig = configuration;
				$scope.configurations = $localstorage.getObject('xcal_config');
				//console.log('baseConfig',$scope.baseConfig);
				$scope.closeDialog();
				
				
			},function(status){
				$scope.pageError = status;
				console.log(status);
			});
		
	};
	
	$scope.getAdjustedVelocity = function(vel,weight){
		var defer = $q.defer();
		$http.jsonp('http://teambackwoods.com/api/bowspeed/velocity/'+vel+'/arrow_weight/'+weight+'/format/json?callback=JSON_CALLBACK')
			.success(function(res){
				defer.resolve(res);
			})
			.error(function(status,err){
				defer.reject(status);
			});
		return defer.promise;
	};
	
	$scope.init();
	
	
	// check for stored configurations. If there are none, show the modal. otherwise, show default item info
	$ionicModal.fromTemplateUrl('templates/configuration.html',{
		scope:$scope
	}).then(function(modal){
		
		$scope.modal = modal;
		
		if(window.localStorage['xcal_config']){
			// load the "default" configuration
			
			var base = $localstorage.getObject('xcal_config');
			//console.log('Configurations', base);
			$rootScope.baseConfig = base[0];
			//console.log('Base Configuration',$rootScope.baseConfig);
			
			$scope.trajectory = Trajectory.calculate(20,parseInt($rootScope.baseConfig.adjusted_velocity),parseInt($rootScope.baseConfig.arrow_weight),parseInt($rootScope.baseConfig.point_weight),parseInt($rootScope.baseConfig.arrow_length),parseFloat($rootScope.baseConfig.diameter),parseInt($rootScope.baseConfig.fletch_length),parseInt($rootScope.baseConfig.fletch_height));
			//console.log('trajectory',$scope.trajectory);
			
			$scope.buildChart($scope.trajectory);
		} else {
			//console.log('no configurations saved');
			
			//$localstorage.setObject('xcal_config',[]);
			//$scope.modal.show();
		}
	});
	
	$scope.closeDialog = function(){
		$scope.modal.hide();
	};
	$scope.openDialog = function(){
		$scope.modal.show();
	};
	
	$scope.removeConfig = function(config){
		$localstorage.removeObject('xcal_config',config);
		$scope.configurations = $localstorage.getObject('xcal_config');
	};
	
	$scope.setDefaultConfig = function(config){
		
	};
	
	$scope.setActive = function(config){
		
		$rootScope.baseConfig = config;
		$scope.trajectory = Trajectory.calculate(20,parseInt($rootScope.baseConfig.adjusted_velocity),parseInt($rootScope.baseConfig.arrow_weight),parseInt($rootScope.baseConfig.point_weight),parseInt($rootScope.baseConfig.arrow_length),parseFloat($rootScope.baseConfig.diameter),parseInt($rootScope.baseConfig.fletch_length),parseInt($rootScope.baseConfig.fletch_height));
		console.log($scope.baseConfig);
		$scope.buildChart($scope.trajectory);
	};
	
	
	
	$scope.buildChart = function(tr){
		var labels = [],
			data = [];
		tr.forEach(function(v){
			labels.push(v.yardage);
			data.push(v.drop.toFixed(2));
		});
		
		console.log('Chart Labels',labels);
		console.log('Chart Data',data);
		
		$scope.chart = {
			
			labels: labels,
			
			datasets: [
				{
					
					fillColor: 'rgba(255,255,255,0.2)',
					strokeColor: '#e67e22',
					pointColor: 'rgba(151,187,205,0)',
					pointStrokeColor: '#e67e22',
					data: data
				}
			],
			
		};
		
		
	};
	
	$scope.chartOptions = {
			
		scaleShowGridLines : true,
		scaleGridLineColor: 'rgba(255,255,255,0.1)',
		scaleGridLineWidth : .5,
		bezierCurve: false,
	};
})

.controller('SettingsCtrl',function($scope){
	
})

.controller('InfoCtrl',function($scope){
	
})

.controller('ChatsCtrl', function($scope, Chats) {
  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
});
