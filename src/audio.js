// Opt-in ambient audio. AudioContext is created only after a user's gesture.
const tones=[110,164.81,220,329.63]; // Original ambient drone, not sourced music.
export function createAmbientAudio(){
  let context=null, voices=[], master=null, enabled=false;
  function start(){
    if(enabled)return true;
    const AudioCtor=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!AudioCtor)return false;
    try{
      context ||= new AudioCtor();
      master ||= context.createGain();
      master.gain.value=.0001;
      master.connect(context.destination);
      voices=tones.map((frequency,i)=>{
        const oscillator=context.createOscillator(),volume=context.createGain();
        oscillator.type=i%2?"triangle":"sine";
        oscillator.frequency.value=frequency;
        volume.gain.value=[.13,.09,.09,.055][i];
        oscillator.connect(volume);volume.connect(master);oscillator.start();
        return oscillator;
      });
      context.resume();
      master.gain.setTargetAtTime(.105,context.currentTime,.5);
      enabled=true;
      return true;
    }catch{return false;}
  }
  function stop(){
    if(!enabled)return;
    enabled=false;
    if(master && context)master.gain.setTargetAtTime(.0001,context.currentTime,.15);
    for(const osc of voices)try{osc.stop(context.currentTime+.6);}catch{}
    voices=[];
  }
  return {toggle(){if(enabled){stop();return false;}return start();},get enabled(){return enabled;},stop};
}
