const d3 = require("d3v4");
//const Midi = require("@tonejs/midi");
//const Tonejs = require("tone");

// http://stackoverflow.com/questions/33695073/javascript-polar-scatter-plot-using-d3-js/33710021#33710021

//<script type="text/javascript" src="https://unpkg.com/@tonejs/ui@0.0.8/build/tonejs-ui.js"></script>
// http://stackoverflow.com/a/929107
var reMap = function(oldValue) {
    var oldMin = 0,
        oldMax = -359,
        newMin = 0,
        newMax = (Math.PI * 2),
        newValue = (((oldValue - 90 - oldMin) * (newMax - newMin)) / (oldMax - oldMin)) + newMin;
    
    return newValue;
  }
  
  var colorScheme = ["#53354a", "#903749", "#e84545", "#2b2e4a"];
  var tracksAngularLinearScales = [];
  var trackPolarRadiusScales = [];
  var radiusScale;
  var audioFileName = "vivaldi";
  var numTracks;
  var audioAngularScale;
  var globalCurrentTime = 0;
  var globalDuration = 0;
  
  
  // https://en.wikipedia.org/wiki/Polar_coordinate_system
  // first is position clockwise, aka angular coordinate, polar angle, or azimuth. range from 0 - 359
  // second is ring (range 0 to 1), aka Radial Coordinate.
  // third is node size radius (center to edge)
  
  
  var processedData = [];

  var width = 600,
    height = 600,
    radius = Math.min(width, height) / 2 - 30; // radius of the whole chart

  var r = d3.scaleLinear()
    .domain([0, 1])
    .range([0, radius]);

  var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .classed("notes", true)
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
  /*
  [
    [reMap(25), 1, 20, "label 1"],
    [reMap(105), 0.8, 10, "label 2"],
    [reMap(266), 1, 8, "label 3"],
    [reMap(8), 0.2, 22, "label 4"],
    [reMap(189), 1, 28, "label 5"],
    [reMap(350), 0.6, 15, "label 6"],
    [reMap(119), 0.4, 24, "label 7"],
    [reMap(305), 0.8, 31, "label 8"]
  ];
*/
  d3.csv("./data/track_info_ver5.csv", function(data){
    //console.log(data);
    
    numTracks = d3.max(data, function(d) { return +d["Track"]; })
    var trackIndex = 0;
    while (trackIndex < numTracks){
        tracksAngularLinearScales[trackIndex] = d3.scaleLinear().domain([d3.min(data, function(d) { return +d["Start"]; }), d3.max(data, function(d) { return +d["Start"]; })]).range([0, 359]);
        //console.log(tracksAngularLinearScales);
        trackIndex += 1;
    }

    trackIndex = 0;

    
    while(trackIndex < numTracks){
        trackPolarRadiusScales[trackIndex] = d3.scaleLinear().domain([d3.min(data, function(d) { return +d["Pitch"]; }) - 20, d3.max(data, function(d) { return +d["Pitch"]; })]).range([0, 1]);

        trackIndex += 1;
    }

    radiusScale = d3.scaleLinear().domain([d3.min(data, function(d) { return +d["Duration"]; }), d3.max(data, function(d) { return +d["Duration"]; })]).range([1, 5]);
    
    data.forEach(rawNote => {
            processedData.push(Array.from(Object.create([
            reMap(tracksAngularLinearScales[((+rawNote["Track"]) - 1)](+rawNote["Start"])),
            trackPolarRadiusScales[(+rawNote["Track"]) - 1](+rawNote["Pitch"]),
            radiusScale(+rawNote["Duration"]),
            rawNote["Octave"],
            rawNote["Instrument"],
            +rawNote["Track"],
            colorScheme[+rawNote["Track"]]
        ])));
        //console.log();
        //console.log(processedData.length);
    });
    //console.log("Processed: " + processedData);

    var line = d3.radialLine()
      .radius(function(d) {
          return r(d[1]);
      })
      .angle(function(d) {
          return -d[0] + Math.PI / 2;
      });
    var tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .text("a simple tooltip");
  
    //console.log(processedData);
/*
    processedData.forEach(element => {
      console.log("forEach: ");
      d3.select(".notes")
        .append("circle")
        .attr("r", function(d) {
          return 2;//d[2];
        })
        .attr("class", "note")
        .attr("transform", function(d) {
          console.log(element);
      
          var coors = line([element]).slice(1).slice(0, -1); // removes "M" and "Z" from string
          return "translate(" + coors + ")"
        })
        .style("fill",function(d,i){
          //console.log(d);
          //console.log("Color: " + colorScheme);
          return "black";
          //return color[i % 12];
        }).on("click", function(d){
          console.log(d);
          
          //return tooltip.style("visibility", "visible");
        });
    });
    */
    d3.select(".notes").selectAll("note")
      .data(processedData)
      .enter()
      .append("circle")
      .attr("class", "note")
      .attr("transform", function(d) {
        //console.log(d);
    
        var coors = line([d]).slice(1).slice(0, -1); // removes "M" and "Z" from string
        return "translate(" + coors + ")"
      })
      .attr("r", function(d) {
        return d[2]
        //return 2;//d[2];
      })
      .style("opacity", 0.8)
      .style("fill", function(d){
        //console.log(colorScheme[d[5]]);
        return d[6];
      }).on("click", function(d){
        console.log(d);
        
        //return tooltip.style("visibility", "visible");
      });


    var lineSelector = d3.select(".notes").append('g').attr("id", "playerSliderLine");
    //initMIDI();
    initPlayerSliderline();
    initAudioComponent();
    //audioAngularScale = d3.scaleLinear().domain([0, globalDuration]).range([0, 359]);
    setInterval(updateView);
    playAudio();
    /*
    var mixer = [];
    var audioPlayers = [];
    var i = 0;
    while (i < numTracks) {
      mixer.push(new Tonejs.Channel().toMaster());
      var tempFileName = "./data/" + audioFileName + "_" + i + ".wav";
      audioPlayers.push(new Tonejs.Player({
        url: tempFileName,
        loop: true
      }).sync().chain(mixer[i]));
    }

    audioPlayers.forEach(track => {
      track.start(0);
    })
*/
  });

  function initAudioComponent() {
    var audios = d3.select(".audioComponents");
    var i = 0;
    while (i < numTracks) {
      var tempFileName = "./data/" + audioFileName + "_" + i + ".wav";
      audios.append("audio")
        .attr("id", "track" + i)
        .attr("src", tempFileName)
        .attr("type", "audio/wav")
        .attr("preload", "metadata")
        .attr("autobuffer", "");
        //.attr("controls", "")
      i++;
    }
    //sleep(2000);
    audio = document.getElementById('track0');
    audio.addEventListener('loadedmetadata', function() {
      console.log(audio.src + ", for: " + audio.duration + "seconds.");
      globalDuration = audio.duration;
      console.log(globalDuration);
      //audio.play(); 
    });

    
  }
  
  function initPlayerSliderline() {
    var lineSelector = d3.select("#playerSliderLine");
    lineSelector
      .append("g")
      .attr("transform", function(d) {
        return "rotate(" + -0 + ")";
      });

    lineSelector.append("line")
      .attr("x2", radius)
      .style("stroke", "black");
  }

  function updatePlayerSliderline(angle){
    var lineSelector = d3.select("#playerSliderLine");
    lineSelector
      .attr("transform", function(d) {
        return "rotate(" + angle + ")";
      });
  }

  function updateView() {
    var angle = getCurrentPlaybackTime() / globalDuration * 359 - 90;//audioAngularScale(getCurrentPlaybackTime());
    console.log(angle);
    updatePlayerSliderline(angle);
  }

  function getCurrentPlaybackTime() {
    //console.log(document.getElementById('track0').currentTime);
    return document.getElementById('track0').currentTime;
  }

  function playAudio(){
    //starts from 0
    var audio0 = document.getElementById('track0');
    var audio1 = document.getElementById('track1');
    var audio2 = document.getElementById('track2');
    audio0.play();
    audio1.play();
    audio2.play();
  }

  function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
  }
  
  
  //console.log(d3.select("circle"));
  //d3.select(".notes").append("circle").attr("r", 1).style("fill", "black");
  /*
  d3.select(".notes").selectAll("note")
    .data(processedData)
    .enter()
    .append("circle")
    .attr("class", "note")
    .attr("transform", function(d) {
      console.log(d);
  
      var coors = line([d]).slice(1).slice(0, -1); // removes "M" and "Z" from string
      return "translate(" + coors + ")"
    })
    .attr("r", function(d) {
      return 2;//d[2];
    })
    .style("fill",function(d,i){
      //console.log(d);
      return "black";
      //return color[i % 12];
    }).on("click", function(d){
      console.log(d);
      
      //return tooltip.style("visibility", "visible");
    });
  */
  
  
  
  // adding labels
  /*
  svg.selectAll("note")
    .data(data)
    .enter().append("text")
        .attr("transform", function(d) {
      //console.log(d);
  
      var coors = line([d]).slice(1).slice(0, -1); // removes "M" and "Z" from string
      return "translate(" + coors + ")"
    })
        .text(function(d) {         
          return d[3]; 
        }); 
  
  */
/*
function initMIDI(){

 if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
    alert("Browser should be updated");
} else {
    var uploader = document.getElementById("uploader");
    uploader.addEventListener("change", handleFiles, false);
}

function handleFiles(e) {
    const files = e.target.files;
    var file = this.files[0];//this.
    parseFile(file);
};


let currentMidi = null

function parseFile(file){
    console.log(file);
    //read the file
    const reader = new FileReader();
    reader.onload = function(e){
        const midi = new Midi(e.target.result);
        //d3.select("#ResultsText").attr("value", JSON.stringify(midi, undefined, 2));
        //d3.select(".controlButton")
        console.info(JSON.stringify(midi, undefined, 2));
        currentMidi = midi
    }
    reader.readAsArrayBuffer(file);
}

const synths = []
d3.select(".controlButton").on("play", (e) => {
    console.log("button");
    const playing = e.detail
    if (playing && currentMidi){
        const now = Tonejs.now() + 0.5
        currentMidi.tracks.forEach(track => {
            //create a synth for each track
            const synth = new Tonejs.PolySynth(10, Tonejs.Synth, {
                envelope : {
                    attack : 0.02,
                    decay : 0.1,
                    sustain : 0.3,
                    release : 1
                }
            }).toMaster()
            synths.push(synth)
            //schedule all of the events
            track.notes.forEach(note => {
                synth.triggerAttackRelease(note.name, note.duration, note.time + now, note.velocity)
            })
        })
    } else {
        //dispose the synth and make a new one
        while(synths.length){
            const synth = synths.shift()
            synth.dispose()
        }
    }
})
}
<input type="file" id="uploader" name="files[]" multiple />
*/