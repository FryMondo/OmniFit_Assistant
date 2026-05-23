import React, {useState} from 'react';
import SpeechRecognition, {useSpeechRecognition} from 'react-speech-recognition';
import {processVoiceRequest} from '../../services/api.ts';
import './VoiceRecorder.css';

const VoiceRecorder: React.FC = () => {
    const {transcript, listening, resetTranscript, browserSupportsSpeechRecognition} = useSpeechRecognition();

    const [mode, setMode] = useState<'nutrition' | 'workout'>('nutrition');
    const [aiResult, setAiResult] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);

    if (!browserSupportsSpeechRecognition) {
        return <p style={{color: 'red'}}>Браузер не підтримує розпізнавання мови.</p>;
    }

    const handleStart = () => SpeechRecognition.startListening({continuous: true, language: 'uk-UA'});
    const handleStop = () => SpeechRecognition.stopListening();

    const sendToAI = async () => {
        if (!transcript) return;
        setLoading(true);
        setAiResult(null);

        try {
            const result = await processVoiceRequest(mode, transcript);
            setAiResult(result);
        } catch (error: any) {
            setAiResult({error: error.message});
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="recorder-container">
            <h3>Оберіть режим роботи:</h3>
            <div className="radio-group">
                <label className="radio-label">
                    <input type="radio" checked={mode === 'nutrition'} onChange={() => {
                        setMode('nutrition');
                        setAiResult(null);
                    }}/>Калорії
                </label>
                <label className="radio-label">
                    <input type="radio" checked={mode === 'workout'} onChange={() => {
                        setMode('workout');
                        setAiResult(null);
                    }}/>Тренування
                </label>
            </div>

            <h3>Запис голосу:</h3>
            <div className="controls-group">
                <button onClick={handleStart} disabled={listening} className="button-primary">Записати</button>
                <button onClick={handleStop} disabled={!listening} className="button-primary button-stop">Зупинити
                </button>
                <button onClick={resetTranscript} className="button-primary button-clear">Очистити</button>
            </div>

            <p>Статус мікрофона: <strong>{listening ? 'Запис...' : 'Вимкнено'}</strong></p>

            <div className="text-box">
                <strong>Надиктований текст:</strong>
                <p className={transcript ? "transcript-text" : "transcript-empty"}>
                    {transcript || "Тут з'явиться ваш текст..."}
                </p>
            </div>

            <button onClick={sendToAI} disabled={!transcript || loading} className="button-primary button-submit">
                {loading ? 'Обробка...' : 'Обробити'}
            </button>

            {aiResult && (
                <div className="result-container">
                    <h3>Результат:</h3>
                    <pre className="result-box">
            {JSON.stringify(aiResult, null, 2)}
          </pre>
                </div>
            )}
        </div>
    );
};

export default VoiceRecorder;