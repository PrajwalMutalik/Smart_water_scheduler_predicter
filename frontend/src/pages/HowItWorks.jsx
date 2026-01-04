import React from 'react';
import { MapPin, Brain, CheckCircle, TrendingUp, Cpu } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      id: 1,
      title: "Data Collection",
      icon: MapPin,
      color: "text-neon-blue",
      description: "We gather precise data points to build your farm's profile.",
      details: [
        "Location specifics (GPS)",
        "Real-time hyper-local weather (Open-Meteo)",
        "Soil composition analysis (SoilGrids)",
        "Crop-specific water coefficients"
      ]
    },
    {
      id: 2,
      title: "Decision Engine",
      icon: Brain,
      color: "text-neon-purple",
      description: "Our ML (Gradient Boosting) processes all inputs to generate daily recommendations.",
      details: [
        "Synthesizes Weather + Soil + Crop + History",
        "No assumptions or averages",
        "Calculates exact water needs for today",
        "Generates confidence scores for transparency"
      ]
    },
    {
      id: 3,
      title: "Farmer Acknowledgment",
      icon: CheckCircle,
      color: "text-neon-green",
      description: "You confirm the action. The system learns from YOU.",
      details: [
        "Review the 'Irrigate' or 'Skip' advice",
        "Mark actions as DONE or SKIPPED",
        "Your feedback is the only way the system advances",
        "Builds a truthful history ledger"
      ]
    },
    {
      id: 4,
      title: "Learning & Scheduling",
      icon: TrendingUp,
      color: "text-neon-orange",
      description: "Every interaction makes the next prediction smarter.",
      details: [
        "Confirmations improve confidence scores",
        "Skipped irrigation adds to tomorrow's demand",
        "Weekly patterns are analyzed and adapted",
        "Personalized calibration for your fields"
      ]
    },
    {
      id: 5,
      title: "Automation (Future)",
      icon: Cpu,
      color: "text-slate-400",
      description: "Today's manual inputs pave the way for full automation.",
      details: [
        "Manual confirmations train the logic",
        "Future IoT devices will replace manual clicks",
        "Logic remains the same, execution becomes automatic",
        "Safety and trust are established first"
      ]
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <div className="text-center space-y-4">
        <h1 className="text-3xl lg:text-4xl font-display font-bold text-white">
          How <span className="text-neon-green">AgriFlow</span> Works
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          A transparent look at how we turn raw data into actionable irrigation decisions.
          No magic, just science and your feedback.
        </p>
      </div>

      <div className="grid gap-8 mt-12">
        {steps.map((step, index) => (
          <div 
            key={step.id} 
            className="group relative bg-obsidian-900/50 border border-white/5 rounded-2xl p-6 lg:p-8 backdrop-blur-sm overflow-hidden hover:border-white/10 transition-colors"
          >
            {/* Connector Line (except for last item) */}
            {index !== steps.length - 1 && (
              <div className="absolute left-[2.85rem] top-24 bottom-[-2rem] w-0.5 bg-gradient-to-b from-white/10 to-transparent lg:left-[50%] lg:ml-[-1px] lg:h-8 lg:top-full lg:bottom-auto hidden lg:block" />
            )}
            
            <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
              {/* Icon Bubble */}
              <div className={`
                flex-shrink-0 w-16 h-16 rounded-2xl bg-obsidian-950 border border-white/10 
                flex items-center justify-center shadow-lg ${step.color} group-hover:scale-105 transition-transform
              `}>
                <step.icon className="w-8 h-8" />
              </div>

              {/* Content */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <span className="opacity-30">0{step.id}</span>
                    {step.title}
                  </h3>
                  <p className="text-slate-400 mt-1 text-lg">{step.description}</p>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-3 pl-0 lg:pl-0">
                  {step.details.map((detail, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 p-6 bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 border border-white/10 rounded-2xl text-center">
        <h3 className="text-white font-semibold text-lg mb-2">Ready to start?</h3>
        <p className="text-slate-400 mb-6 max-w-2xl mx-auto">
          Go to your dashboard or add a farm to begin the cycle of data collection and decision making.
        </p>
      </div>
    </div>
  );
};

export default HowItWorks;
