angular.module('excalibur.controllers', ['ngCordova','angles'])

.controller('SetupCtrl',function($scope,$rootScope,$http,$q,$window,$location,$localstorage,Trajectory){
	$scope.init=function(){
		$scope.getEquipment()
			.then(function(res){
				console.log(res);
				$scope.bows = res.crossbows;
				$scope.arrows = res.arrows;
				console.log('arrows',$scope.arrows);
			},function(status){
				$scope.pageError = status;
				console.log(status);
			});
	};
	
	$scope.getEquipment=function(){
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
	
	
	$scope.init();
	
	$scope.saveSetup = function(setup){
		var bow = $scope.bows[setup.bow],
			arrow = $scope.arrows[setup.arrow],
			point = setup.point,
			totalArrowWeight = parseInt(arrow.weight) + parseInt(point);
		console.log('arrow',arrow);
		$scope.getAdjustedVelocity(bow.velocity,totalArrowWeight,bow.arrow_weight)
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
				
				if(!$window.localStorage['xcal_config']){
					$localstorage.setObject('xcal_config',[]);
					$localstorage.pushObject('xcal_config',configuration);
				}else{
					$localstorage.pushObject('xcal_config',configuration);
				}
				
				$rootScope.trajectory = Trajectory.calculate(20,parseInt($scope.adjustedVelocity.adjusted_velocity),parseInt(arrow.weight),parseInt(point),parseInt(arrow.length),parseFloat(arrow.diameter),parseInt(arrow.fletch_length),parseInt(arrow.fletch_height));
				console.log('Trajectory',$rootScope.trajectory);
				
				$rootScope.baseConfig = configuration;
				$rootScope.configurations = $localstorage.getObject('xcal_config');
				
				$rootScope.chart = Trajectory.buildChart($rootScope.trajectory);
				
				$location.path('/tabs/dash');
				
			},function(status){
				$scope.pageError=status;
				console.log(status);
			});
	};
	
	$scope.getAdjustedVelocity = function(vel,weight,base){
		var defer = $q.defer();
		$http.jsonp('http://teambackwoods.com/api/bowspeed/velocity/'+vel+'/arrow_weight/'+weight+'/base_arrow/'+base+'/format/json?callback=JSON_CALLBACK')
			.success(function(res){ 
				defer.resolve(res);
			}) .error(function(status){
				defer.reject(status);
			});
		return defer.promise;
	};
	
	
	
	$scope.chartOptions = {
			
		scaleShowGridLines : true,
		scaleGridLineColor: 'rgba(255,255,255,0.1)',
		scaleGridLineWidth : .5,
		bezierCurve: false,
	};
})


.controller('AppCtrl', function($scope,$state,$location,$window,$ionicHistory,$rootScope,$http,$q,$ionicModal,Trajectory,$localstorage) {
	// check localStorage for a stored configuration.
	// redirect if none found.
	
	if(! $window.localStorage['xcal_config']){
		console.log('No Configuration Found');
		$ionicHistory.nextViewOptions({
			disableAnimate: true,
			disableBack: true
		});
		$location.path("/setup");
		
	} else {
		
		// get the "default" bow configuration
		if(!$rootScope.baseConfig){
			var configurations = $localstorage.getObject('xcal_config');
			$rootScope.configurations = configurations;
			var base = configurations[0];
			$rootScope.baseConfig = base;
			var traj = Trajectory.calculate(20,parseInt($rootScope.baseConfig.adjusted_velocity),parseInt($rootScope.baseConfig.arrow_weight),parseInt($rootScope.baseConfig.point_weight),parseInt($rootScope.baseConfig.arrow_length),parseFloat($rootScope.baseConfig.diameter),parseInt($rootScope.baseConfig.fletch_length),parseInt($rootScope.baseConfig.fletch_height));
			$rootScope.trajectory = traj;
			console.log('Config:',$rootScope.baseConfig);
		}
		
		//console.log($scope.baseConfig);
		$scope.chartData = Trajectory.buildChart($rootScope.trajectory);
		//console.log($scope.chartData);
		$scope.chart = $scope.chartData;			
		console.log($scope.chart);
		$scope.chartOptions = {
				
			scaleShowGridLines : true,
			scaleGridLineColor: 'rgba(255,255,255,0.5)',
			scaleGridLineWidth : .5,
			//bezierCurve: false,
		};
		
		$scope.refreshChart = function(){
			console.log('refresh chart called.');
			//console.log($rootScope.trajectory);
			$scope.chart = Trajectory.buildChart($rootScope.trajectory);
			//console.log($scope.chart);
		};
		
		//$scope.refreshChart();
		
		//$scope.init();
		
		
		
		
		$scope.$on('updateChart',function(event,response){
			console.log('updateChart event fired:', event);
			
			$scope.refreshChart();
			console.log($scope.chart);
		});
		
	}
	
	
})

.controller('SettingsCtrl',function($scope,$state,$rootScope,$http,$q,$ionicModal,$window,$localstorage,Trajectory){
	
	console.log('SettingsCtrl called');
	
	//$scope.configurations = $localstorage.getObject('xcal_config');
	
	$scope.openDialog = function(){
		console.log('openDialog called');
		
		$scope.getEquipment()
			.then(function(res){
				
				$scope.bows = res.crossbows;
				$scope.arrows = res.arrows;
				
				$scope.modal.show();
				
			},function(status,err){
				$scope.pageError = status;
				console.log(status);
			});
		
	};
	
	$scope.closeDialog = function(){
		$scope.modal.hide();
	};
	
	$scope.getEquipment = function(){
		var defer = $q.defer();
		$http.jsonp('http://teambackwoods.com/api/equipment/format/json?callback=JSON_CALLBACK')
			.success(function(res){
				defer.resolve(res);
			})
			.error(function(status){
				defer.reject(status);
			});
		return defer.promise;
	};
	
	$scope.saveSetup = function(setup){
		var bow = $scope.bows[setup.bow],
			arrow = $scope.arrows[setup.arrow],
			point = setup.point,
			totalArrowWeight = parseInt(arrow.weight) + parseInt(point);
			
			$scope.getAdjustedVelocity(bow.velocity,totalArrowWeight,bow.arrow_weight)
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
					
					if(!$window.localStorage['xcal_config']){
						$localstorage.setObject('xcal_config',[]);
						$localstorage.pushObject('xcal_config',configuration);
					}else{
						$localstorage.pushObject('xcal_config',configuration);
					}
					
					$scope.configurations = $localstorage.getObject('xcal_config');
					
					$scope.closeDialog();
					
				},function(status){});
	};
	
	$scope.getAdjustedVelocity = function(vel,weight,base){
		var defer = $q.defer();
		$http.jsonp('http://teambackwoods.com/api/bowspeed/velocity/'+vel+'/arrow_weight/'+weight+'/base_arrow/'+base+'/format/json?callback=JSON_CALLBACK')
			.success(function(res){
				defer.resolve(res);
			})
			.error(function(status,err){
				defer.reject(status);
			});
		return defer.promise;
	};
	
	$scope.setActive = function(config){
		//console.log('config:',config);
		$rootScope.baseConfig = config; 
		console.log($rootScope.baseConfig);
		$rootScope.trajectory = Trajectory.calculate(20,parseInt($rootScope.baseConfig.adjusted_velocity),parseInt($rootScope.baseConfig.arrow_weight),parseInt($rootScope.baseConfig.point_weight),parseInt($rootScope.baseConfig.arrow_length),parseFloat($rootScope.baseConfig.diameter),parseInt($rootScope.baseConfig.fletch_length),parseInt($rootScope.baseConfig.fletch_height));
		$rootScope.$broadcast('updateChart');
		$state.go('tab.dash');
	};
	
	$scope.removeConfig = function(config,id){
		
		$localstorage.removeObject('xcal_config',config,id);
		$scope.configurations = $localstorage.getObject('xcal_config');
	};
	
	$ionicModal.fromTemplateUrl('templates/newsetup.html',{
		scope: $scope
	}).then(function(modal){
		$scope.modal = modal;
	});
})

.controller('InfoCtrl',function($scope){
	
})
.controller('ChatsCtrl', function($scope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
});

