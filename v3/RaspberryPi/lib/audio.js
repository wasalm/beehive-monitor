/*
 * Libraries
 */
const Mic = require('node-microphone');
const fftw = require("node-fftw");

/*
 * Module to analyse audio signal
 */
module.exports = class{

    constructor(dev = "plughw:1,0", rate = 16000) {
        this.dev = dev;
        this.rate = rate;
    }

    getSample(duration) {
        return new Promise((resolve, reject) => {
            const num = this.rate * duration;
            let ptr = 0;
            
            let mic = new Mic({
                endian: "little",
                bitwidth: 16,
                encoding: "unsigned-integer",
                rate: this.rate,
                channels: 1,
                additionalParameters: ["-t", "raw"],
                device: this.dev,
            });

            mic.on("error", reject);
            let micStream = mic.startRecording();
            let dftPlan = new fftw.dftPlan(true, [num], -1, fftw.flags.FFTW_DESTROY_INPUT);

            micStream.on('data', (data) => {
                for(let i=0; i< data.length; i++) {
                    if(ptr % 2 == 0) {
                        dftPlan.in[ptr/2] = data[i];
                    } else {
                        dftPlan.in[(ptr-1)/2] = data[i] * 256;
                    }

                    if(ptr == (num*2)-1) {
                        mic.stopRecording();
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

                            for(let j=0; j< plan.out.length; j+= 2) {
                                let val = plan.out[j] * plan.out[j] + plan.out[j+1] + plan.out[j+1];
                                result.s_tot += val;

                                if(j >= 98 * duration * 2 && j < 146 * duration * 2) {
                                    result.s_bin098_146 += val;
                                }

                                if(j >= 146 * duration * 2 && j < 195 * duration * 2) {
                                    result.s_bin146_195 += val;
                                }

                                if(j >= 195 * duration * 2 && j < 244 * duration * 2) {
                                    result.s_bin195_244 += val;
                                }

                                if(j >= 244 * duration * 2 && j < 293 * duration * 2) {
                                    result.s_bin244_293 += val;
                                }

                                if(j >= 293 * duration * 2 && j < 342 * duration * 2) {
                                    result.s_bin293_342 += val;
                                }

                                if(j >= 342 * duration * 2 && j < 391 * duration * 2) {
                                    result.s_bin342_391 += val;
                                }

                                if(j >= 391 * duration * 2 && j < 439 * duration * 2) {
                                    result.s_bin391_439 += val;
                                }

                                if(j >= 439 * duration * 2 && j < 488 * duration * 2) {
                                    result.s_bin439_488 += val;
                                }

                                if(j >= 488 * duration * 2 && j < 537 * duration * 2) {
                                    result.s_bin488_537 += val;
                                }

                                if(j >= 537 * duration * 2 && j < 586 * duration * 2) {
                                    result.s_bin537_586 += val;
                                }
                            }

                            micStream = null;
                            mic = null;
                            dftPlan = null;
                            resolve(result);
                        });
                    }

                    ptr ++;
                }
            });
        });  
    }

}