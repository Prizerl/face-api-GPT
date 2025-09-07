import React, { useState } from 'react';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState(''); // 감정 상태 저장
  const [isWebcamOn, setIsWebcamOn] = useState(true); // 웹캠 상태
  

  const apiKey = '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'; // 여기에 API 키를 입력하세요.
  const apiEndpoint = 'https://api.openai.com/v1/chat/completions';

  const addMessage = (sender, message) => {
    setMessages(prevMessages => [...prevMessages, { sender, message }]);
  };

  let lastDetectedEmotion = null; 

  const handleSendMessage = async () => {
    const message = userInput.trim();
    if (message.length === 0) return;
  
    addMessage('user', message);
    setUserInput('');
    setLoading(true);
  
    // 현재 감정을 가져옵니다.
    let detectedEmotion = window.getLastDetectedEmotion();
  
    // neutral 감정은 무시하고, 이전 감정이 있을 경우 유지합니다.
    if (detectedEmotion === "neutral") {
      detectedEmotion = lastDetectedEmotion;  // neutral일 경우 이전 감정 사용
    } else {
      lastDetectedEmotion = detectedEmotion;  // 다른 감정이 감지되면 그 감정 저장
    }
  
    // 감정 상태에 따른 프롬프트를 생성합니다.
    const emotionPrompt = `당신은 심리상담가 챗봇입니다. 
    사용자의 감정이 ${detectedEmotion || "표정이 감지되지 않았습니다"}일 때 적절한 상담을 제공하세요.
    메시지: "${message}". 항상 친절하게 답변하고, 사용자의 감정에 따라 공감하며 응답하세요. 이모티콘을 사용하여 부드럽게 대화하세요.`;
  
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: emotionPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 1024,
          top_p: 1,
          temperature: 1,
          frequency_penalty: 0.5,
          presence_penalty: 0.5,
        }),
      });
  
      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || 'No response';
      addMessage('bot', aiResponse);
    } catch (error) {
      console.error('오류 발생!', error);
      addMessage('bot', '오류 발생!');
    } finally {
      setLoading(false);
    }
  };
  

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleButtonClick = () => {
    const currentEmotion = window.getLastDetectedEmotion();
    setEmotion(currentEmotion); // 현재 감정 상태를 업데이트
    handleSendMessage(); // 메시지 전송
  };

  const Web_cam_visility = () => {
    const videoElement = document.getElementById("video");
    if (isWebcamOn) {
      videoElement.style.visibility = "hidden"; // 캠 끄기
    } else {
      videoElement.style.visibility = "visible"; // 캠 켜기
    }
    setIsWebcamOn(!isWebcamOn); // 웹캠 상태 토글
    document.getElementById("Web_cam_visility").innerHTML = isWebcamOn ? "캠 켜기" : "캠 끄기"; // 버튼 텍스트 변경
  };

  return (
    <div id='Chatbot'>
      <div id="infa">
        <button id="Web_cam_visility" onClick={Web_cam_visility}>캠 끄기</button>
      </div>
      <div className='chatDiv'>
        {loading && <span className="messageWait">답변을 기다리고 있습니다</span>}
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {`${msg.sender === 'user' ? '나' : '챗봇'} : ${msg.message}`}
          </div>
        ))}
      </div>
      <div className='inputDiv'>
        <input
          type='text' placeholder='메시지를 입력하세요'
          value={userInput} onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleButtonClick}>전송</button>
      </div>
    </div>
  );
};

export default Chatbot;
