const Mic = require('node-microphone');
const fftw = require("node-fftw");

let mic = new Mic({
	endian: "little",
	bitwidth: 16,
	encoding: "unsigned-integer",
	rate: 16000,
	channels: 1,
	additionalParameters: ["-t", "raw"],
	device: "plughw:1,0",
});

console.log(mic.rate);

let micStream = mic.startRecording();

let ptr = 0;
let dftPlan;

function parseWAV(bit, pos) {
	if(pos == 0) {
		dftPlan = new fftw.dftPlan(true, [mic.rate], -1, fftw.flags.FFTW_DESTROY_INPUT);
	}

	if(pos % 2 == 0) {
		dftPlan.in[pos/2] = bit;
	} else {
		dftPlan.in[(pos-1)/2] = bit * 256;
	}

	if(pos == (mic.rate*2)-1) {
		dftPlan.calcAsync(function(plan) {
			let result = {
				s_tot: 0,
				s_bin098_146: 0,
				s_bin146_195: 0,
				s_bin195_244: 0,
				s_bin244_293: 0,
				s_bin293_342: 0,
				s_bin342_391: 0,
				s_bin391_439: 0,
				s_bin439_488: 0,
				s_bin488_537: 0,
				s_bin537_586: 0
			};

			for(let i=0; i< plan.out.length/2; i++) {
				let val = Math.sqrt(plan.out[2*i]*plan.out[2*i] + plan.out[2*i+1]*plan.out[2*i+1]);
				result.s_tot += val;
			}

			for(let i=98; i< 146; i++) {
                                let val = Math.sqrt(plan.out[2*i]*plan.out[2*i] + plan.out[2*i+1]*plan.out[2*i+1]);
                                result.s_bin098_146 += val;
                        }

			for(let i=146; i< 195; i++) {
                                let val = Math.sqrt(plan.out[2*i]*plan.out[2*i] + plan.out[2*i+1]*plan.out[2*i+1]);
                                result.s_bin146_195 += val;
                        }

			for(let i=195; i< 244; i++) {
                                let val = Math.sqrt(plan.out[2*i]*plan.out[2*i] + plan.out[2*i+1]*plan.out[2*i+1]);
                                result.s_bin195_244 += val;
                        }

			for(let i=244; i< 293; i++) {
                                let val = Math.sqrt(plan.out[2*i]*plan.out[2*i] + plan.out[2*i+1]*plan.out[2*i+1]);
                                result.s_bin244_293 += val;
                        }

			for(let i=293; i< 342; i++) {
                                let val = Math.sqrt(plan.out[2*i]*plan.out[2*i] + plan.out[2*i+1]*plan.out[2*i+1]);
                                result.s_bin293_342 += val;
                        }

			for(let i=342; i< 391; i++) {
                                let val = Math.sqrt(plan.out[2*i]*plan.out[2*i] + plan.out[2*i+1]*plan.out[2*i+1]);
                                result.s_bin342_391 += val;
                        }

			for(let i=391; i< 439; i++) {
                                let val = Math.sqrt(plan.out[2*i]*plan.out[2*i] + plan.out[2*i+1]*plan.out[2*i+1]);
                                result.s_bin391_439 += val;
                        }

			for(let i=439; i< 488; i++) {
                                let val = Math.sqrt(plan.out[2*i]*plan.out[2*i] + plan.out[2*i+1]*plan.out[2*i+1]);
                                result.s_bin439_488 += val;
                        }

			for(let i=488; i< 537; i++) {
                                let val = Math.sqrt(plan.out[2*i]*plan.out[2*i] + plan.out[2*i+1]*plan.out[2*i+1]);
                                result.s_bin488_537 += val;
                        }

			for(let i=537; i< 586; i++) {
                                let val = Math.sqrt(plan.out[2*i]*plan.out[2*i] + plan.out[2*i+1]*plan.out[2*i+1]);
                                result.s_bin537_586 += val;
                        }

			console.log(Object.values(result).map(v => {return Math.log(v)}));
			process.exit();
		});
		return true;
	}

	return false;
}

micStream.on('data', (data) => {
	for(let i=0; i< data.length; i++) {
		if(parseWAV(data[i], ptr)) {
			ptr=0;
		} else {
			ptr++;
		}
	}
	//http://soundfile.sapp.org/doc/WaveFormat/
});

setTimeout(() => {
	console.log('stopped recording');
        mic.stopRecording();
}, 3000);


mic.on('error', (error) => {
	console.log(error);
});