import React from 'react';
import './FlashAnnouncement.css';

export default function FlashAnnouncement() {
  return (
    <div className="flash-announcement-bar">
      <div className="flash-badge">🚨 ANNOUNCEMENT / ప్రకటన</div>
      <div className="flash-marquee-container">
        <div className="flash-marquee-content">
          <span>📖 8వ బ్యాచ్ | FREE BIBLE ONLINE TRAINING COURSE 🎓 3 నెలల ఉచిత బైబిల్ కోర్స్ (Free Admission, Tuition Fee & Books)! Online/Offline Classes. కేవలం 100 సీట్లు మాత్రమే! 📞 Contact: 8885831588 | 8074852725</span>
          <span>✨ దేవుని వాక్యాన్ని లోతుగా నేర్చుకోండి! ముందుగా ప్రార్థించి ఈ అవకాశాన్ని ఉపయోగించుకోండి. 🙏 Share with others!</span>
        </div>
      </div>
    </div>
  );
}