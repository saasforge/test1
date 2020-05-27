Vue.component('canvasa',{
    template: 
    `<div class="row">
        <div class="col-md-9">
            <div>
                <div>
                    <label for="inputStep">Please select a step size</label>
                    <div class="mt-2 mb-2">
                        <input type="number" v-model="step" class="form-control w-25" @change="stepChanged" max="10" min="1" />
                    </div>
                </div>
                <div>
                    <h4>{{info}}</h4>
                    <div class="mt-2 mb-2">
                        <input type="file" @change="loadData" id="inputFile" class="form-control" />
                    </div>
                </div>
                <div>
                    <div class="d-flex">
                        <div class="block-start block-round"></div> - start point
                    </div>
                    <div class="d-flex">
                        <div class="block-finish block-round"></div> - finish point
                    </div>
                </div>
                <div id="canvasContainer" class="canvas-container">
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <h4>Points visited more than once:</h4>
            <div class="block-stats">
                <ul>
                    <li v-for="point in multiplePoints" :key="point.toString()">
                    {{point[0]}}, {{point[1]}}
                    </li>
                </ul>
            </div>
        </div>
    </div>`,
    data: function(){
        return {
            a: 5,
            canvas: null,
            context: null, 
            currentPoint: [0,0],
            currentDirection: 's',
            path: [],
            multiplePoints: [],
            offsets: [],
            route: '',
            step: 5,
            stringPath: '',
            info: 'Please select a file to load the data from'
        }
    },
    mounted: function(){
        this.createCanvas();
        //this.calculateTurtlePath();
        //this.runUnitTests();
    },
    methods: {
        loadData: function(event){
            this.info = 'Please wait until data is loaded...';
            var file = event.target.files[0];
            var reader = new FileReader();
            var self = this;
            this.route = '';
            this.path = [];
            this.multiplePoints = [];
            this.offsets = [];
            this.stringPath = '';

            reader.onload = function(e){
                // We have to set timeout to give the Vue js rerender the information line
                setTimeout(function(){
                    self.route = e.target.result;
                    self.calculateTurtlePath();
                    self.drawPath();
                    self.info = 'Loaded all data!';
                }, 400);
                
            };
            reader.readAsText(file);
        },
        stepChanged: function(e){     
            this.step = parseInt(e.target.value);   
        },
        createCanvas: function () { 
            var c; 
            c = document.createElement("canvas");
            document.getElementById('canvasContainer').appendChild(c); 
            this.canvas = c;
            this.context = this.canvas.getContext('2d');
        },
        changeDirection: function(currentDirection, turn){
            var directions = ['s', 'w', 'n', 'e'];
            var currentIndex = directions.indexOf(currentDirection);
            var index = turn == 'L' ? currentIndex + 1 : (turn == 'R' ? currentIndex - 1 : currentIndex);
            index = index < 0 ? 3 : index;
            return directions[index];
        },
        calculateTurtlePath: function(){
            var maxX = 0, minX = 0, maxY = 0, minY = 0;
            var x = 0, y = 0;
            this.path.push([x, y]);
            var currentDirection = 's';
            for (var i = 0; i <this.route.length; i++){

                if (this.route[i] == 'F'){
                    switch(currentDirection){
                        case 's':
                            x = x;
                            y = y + this.step;
                            break;
                        case 'n':
                            x = x;
                            y = y - this.step;
                            break;
                        case 'w':
                            x = x - this.step;
                            y = y;
                            break;
                        case 'e':
                            x = x + this.step;
                            y = y;
                            break;
                    }
                    this.path.push([x, y]);
                    if (x > maxX){
                        maxX = x;
                    }
                    if (x < minX){
                        minX = x;
                    }
                    if (y > maxY){
                        maxY = y;
                    }
                    if (y < minY){
                        minY = y;
                    }
                } else {
                    currentDirection = this.changeDirection(currentDirection, this.route[i]);
                }
                /*this.context.moveTo(this.currentPoint[0], this.currentPoint[1]);
                this.currentPoint = [x, y];
                this.context.lineTo(this.currentPoint[0], this.currentPoint[1]);
                this.context.stroke();*/
            }
            this.canvas.width = Math.abs(minX) + maxX + 20; // 10 - min width and height of canvas
            this.canvas.height = Math.abs(minY) + maxY + 20;
            this.offsets = [Math.abs(minX) + 10, Math.abs(minY) + 10]; 
            this.stringPath = JSON.stringify(this.path.map(function(point){return point[0] + ":" + point[1]}));
        },
        drawPoint: function(color, x, y, size){
            this.context.fillStyle = color;
            this.context.beginPath();
            this.context.arc(x, y, size, 0, 2 * Math.PI);
            this.context.fill();
            this.context.lineWidth = 1;
            this.context.strokeStyle = '#000';
            this.context.stroke();
        },
        drawPath: function(){
            var self = this;
            for (var i = 0; i< this.path.length - 1; i++){
                var toX = this.path[i + 1][0] + this.offsets[0], toY = this.path[i + 1][1] + this.offsets[1];
                this.context.moveTo(this.path[i][0] + this.offsets[0], this.path[i][1] + this.offsets[1]);
                this.context.lineTo(toX, toY);
                this.context.stroke();
                var pointOriginal = [this.path[i + 1][0]/this.step, this.path[i + 1][1]/this.step];
                //var countFound = (this.stringPath.match(new RegExp('"' + this.path[i + 1][0] + ':' + this.path[i + 1][1] + '"', 'g')) || []).length;
                var countFound = this.path.filter(function(point){
                    return (point[0] == self.path[i + 1][0] && point[1] == self.path[i + 1][1]);
                }).length;
                if (countFound > 1) {
                    // Has been here
                    var alreadyExists = this.multiplePoints.filter(function(point){
                        return point[0] == pointOriginal[0] && point[1] == pointOriginal[1];
                    });
                    if (!alreadyExists.length){
                        this.multiplePoints.push([pointOriginal[0], pointOriginal[1]]);
                    }
                }
                
            }
            // Put start and finish points
            this.drawPoint('#207edb', this.path[0][0] + this.offsets[0], this.path[0][1] + this.offsets[1], 5);
            this.drawPoint('#ddcd13', this.path[this.path.length - 1][0] + this.offsets[0], this.path[this.path.length - 1][1] + this.offsets[1], 5);
            
            // Draw small multiple visits points
            for (var i = 0; i < this.multiplePoints.length; i++){
                this.drawPoint('#e64c33', this.multiplePoints[i][0] * this.step + this.offsets[0], 
                                          this.multiplePoints[i][1] * this.step + this.offsets[1], 2);
            }
        }, 
        runUnitTests: function(){
            // Simple unit test 1
            this.route = 'LLFFF';
            this.calculateTurtlePath();
            console.log(this.canvas.height == 13 ? 'OK' : 'FAIL: ' + this.canvas.height + ' expected 13');
            console.log(this.canvas.width == 10 ? 'OK' : 'FAIL: ' + this.canvas.width + ' expected 10');

            // Check multiple points
        }
    }
});


var app = new Vue({
    el: '#app',
    watch: {},
    data: {
    },
    methods: {}
})