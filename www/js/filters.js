angular.module('excalibur.filters',[])

.filter('model',function(){
	return function(input){
		
		if(String(input) === 'undefined'){var output="Crossbow"}else{ var ouput=input; }
		return '<span class="model-title">Excalibur</span> ' + output;
	};
})
.filter('length',function(){
	return function(input){
		return input + ' inches';
	};
}).filter('weight',function(){
	return function(input){
		return input + ' grains';
	};
}).
filter('velocity',function(){
	return function(input){
		return input + ' FPS';
	};
});
