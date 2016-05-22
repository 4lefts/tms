new p5(function(p){

	//variables for the canvas and holder (i.e. parent div)
	var holder, holderSize, canvas 

	var synths = []
	var tms =[] //the thue-morse sequence
	var tmsText = '' //the thue-morse sequence as a string

	//note variables
	var root = 36 //A4, 440hz
	var scale = [0, 2, 3, 5, 7, 8, 10, 12]
	var motif = [] // the notes of a riff
	var weighting = [6, 1, 3, 1, 4, 1, 2, 4] //array to hold the chance of choosing each note for the motif
	var tracks = [[], []]
	var hzs = [] // notes as hz
	var note = 0 //note in scale to play

	var isPlaying = false

	//sequencer stuff
	var framerate = 60, //idealized - timing won't be tight
		tempo = 80, 
		sixteenth, //how many frames is a 16th at the given tempo?
		offset = 0, //the current offset for the sequence track (in array places)
		counters = [0, 0] //place in tm sequence

	p.setup = function(){

		//get the parent div for the canvas
		holder = p.select('#sketchContainer')
		
		//get size of parent div, (returns an object)
		var holderSize = holder.size()
		
		//set canvas to with of parent div - makes sketch responsive
		//use holderSize.width for both - make canvas square
		//(holder.height returns height of 100px, unless css size is absolute)
		canvas = p.createCanvas(holderSize.width, holderSize.height)
		p.textFont('monospace')
		p.textSize(16)

		synths[0] = new p.Pling()
		synths[1] = new p.Pling()
	
		tms = thue_morse.compute(8)
		tmsText = tms.join(' ')
		sixteenth = tempoCalc.calc(framerate, tempo, 16) //calc frames per 16th

		//initialise motif, hzs and counters
		p.initNotes()

		//log out vars
		console.log('thue-morse seq: ' + tms)
		console.log('16th note is ' + sixteenth + ' frames')
		console.log('motif: ' + motif)
		console.log('scale (in hz): ' + hzs)
		console.log('track 1: ' + tracks[0])
		console.log('track 2: ' + tracks[1])

		//bind listener functions to clicking on this canvas element
		//e.g. - canvas.mousePressed(p.somefunction)
		//lots more listed at http://p5js.org/reference/#/p5.Element/touchEnded
		canvas.mousePressed(p.play)
	}

	//responsively resize canvas if window is resized
	p.windowResized = function(){
		holderSize = holder.size()
		p.resizeCanvas(holderSize.width, holderSize.height)
	}

	p.draw = function(){
		if(isPlaying){
			if(p.frameCount % sixteenth == 0){ //each sixteenth note
			
				var dispText = p.buildDispText()
				var noteText = p.buildNoteText()

				p.background(0)
				p.drawText(dispText, 16, 180, p.LEFT, 0, 10, p.width, p.height)

				p.drawText(noteText, 72, 200, p.CENTER, 0, p.height * 0.75, p.width, 72)				
				// p.textAlign(p.CENTER)
				// p.textSize(72)
				// p.text(noteText, 10, p.height/2, p.width, 72)
			
				for(var i = 0; i < counters.length; i++){
					if(tms[counters[i]] == 1){
						//play note
						synths[i].trigger(hzs[note], 0.4, (i * 2) - 1)
						//draw
						// p.noStroke()
						// p.fill(255, 200)
						// p.beginShape()
						// p.vertex(p.width/2, p.height/2)
						// p.vertex(p.width * i, motif[note] * 30) //30 = 360/8
						// p.vertex(p.width * i, (motif[note] * 30) + 30)
						// // p.vertex(p.random(i * (p.width/2), (i * (p.width/2)) + p.width/2), p.random(0, p.height))
						// p.endShape(p.CLOSE)
						// // p.line(p.width/2, p.height/2, p.random(0, p.width), p.random(0, p.height))
					}
				}
				note = (note + 1) % hzs.length
				counters[0] = (counters[0] + 1) % tms.length
				counters[1] = (counters[1] + 1) % tms.length
				//set the second counter to an offset when the first counter wraps round 
				if(counters[0] == tms.length - 1){
					offset = (offset + 1) % tms.length
					counters[1] = offset
				}
			}
		} else {
			p.background(0)
		}

	}

	p.play = function(){
		//re-randomise notes and counters when sequncer stops
		if(isPlaying){
			p.initNotes()
		}
		isPlaying = !isPlaying
	}

	//synthesizer
	p.Pling = function(){

		this.env = new p5.Env()	
		this.env.setADSR(0.001, 0.333, 0, 0)

		this.osc = new p5.Oscillator()
		this.osc.setType('triangle')
		this.osc.amp(this.env)
		this.osc.start()

		this.del = new p5.Delay()
		this.del.process(this.osc, 0.200, 0.3, 5000)

		/*arguments are:
		freq (hz),
		amplitude,
		panning (-1 to 1)*/
		this.trigger = function(h, a, p){
			this.osc.freq(h)
			this.osc.pan(p)
			this.env.setRange(a, 0)
			this.env.play(this.osc)
		}
	}

	//------------------------------------------
	//functions for building arrays of notes etc:
	//------------------------------------------

	//pick a random item from an array based on an array of weightings
	p.weightedRand = function(arr, weightArr){
		//sum the weight array
		var totalWeight = weightArr.reduce(function(prev, elem){ 
			return prev + elem
		})

		var randomNum = Math.floor(p.random(0, totalWeight))
		//keep a total of the weight array we've been through so far
		var currentWeight = 0
		for(var i = 0; i < arr.length; i++){
			currentWeight += weightArr[i]
			if(randomNum <= currentWeight){
				return arr[i]
			}
		}
	}

	p.initNotes = function(){
		motif = p.makeMotif(scale, weighting)
		hzs = p.makeHz(motif, root)
		counters = [0,0]//p.counterRandom(counters)
	}

	p.makeMotif = function(arr, weightArr){
		return arr.map(function(){
			return p.weightedRand(arr, weightArr)
		})
	}

	p.makeHz = function(arr, rootNote){
		return arr.map(function(elem){
			return p.midiToFreq(elem + rootNote)
		})
	}

	//set up a random start point for the counters in the tm sequence	
	p.counterRandom = function(arr){
		var counterSeed = Math.floor(p.random(tms.length))
		return arr.map(function(){
			return counterSeed
		})
	}

	//---------------------------------------------------
	//functions for making strings of text for display etc
	//---------------------------------------------------

	p.buildDispText = function(){
		var ret = tmsText + '\ncounter 0: ' + counters[0] + '\ncounter 1: ' + counters[1]
		return ret
	}

	p.buildNoteText = function(){
		var ret = p.equalLen(hzs[note] * tms[counters[0]], 6)
		ret += '\t'
		ret += p.equalLen(hzs[note] * tms[counters[1]], 6)
		return ret
	}

	//hacky helper function to slice strings to equal length for nicer display
	p.equalLen = function(i, l){
		return (i + '      ').slice(0, l)
	}

	p.drawText = function(txt, sz, grey, jst, x, y, w, h){
		p.push()
		p.noStroke()
		p.fill(grey)
		p.textAlign(jst)
		p.textSize(sz)
		p.text(txt, x, y, w, h)//10, 0, p.width, p.height)
		p.pop()
	}

}, 'sketchContainer')