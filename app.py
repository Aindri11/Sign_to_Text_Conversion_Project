from flask import Flask, render_template, Response, jsonify, request
import cv2
import numpy as np
import operator
from string import ascii_uppercase
from keras.models import model_from_json
from hunspell import Hunspell

app = Flask(__name__)

# Load Hunspell Dictionary
hs = Hunspell('en_US')

# Load Model Function
def load_model(model_json_path, model_weights_path):
    with open(model_json_path, "r") as json_file:
        model_json = json_file.read()
    model = model_from_json(model_json)
    model.load_weights(model_weights_path)
    return model

# Load Models
main_model = load_model("models/model_new.json", "models/model_new.h5")
dru_model = load_model("models/model-bw_dru.json", "models/model-bw_dru.h5")
tkdi_model = load_model("models/model-bw_tkdi.json", "models/model-bw_tkdi.h5")
smn_model = load_model("models/model-bw_smn.json", "models/model-bw_smn.h5")

# Start Video Capture
cap = cv2.VideoCapture(0)

# Hand Region
x1, y1, x2, y2 = 250, 50, 550, 350  

# Prediction Function
def predict_symbol(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 2)
    th3 = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
    _, test_image = cv2.threshold(th3, 70, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    test_image = cv2.resize(test_image, (128, 128))
    result = main_model.predict(test_image.reshape(1, 128, 128, 1))

    prediction = {"blank": result[0][0]}
    for i, letter in enumerate(ascii_uppercase):
        prediction[letter] = result[0][i + 1]

    prediction = sorted(prediction.items(), key=operator.itemgetter(1), reverse=True)
    current_symbol = prediction[0][0]

    return current_symbol

# Video Streaming Function
def generate_frames():
    while True:
        success, frame = cap.read()
        if not success:
            break
        else:
            frame = cv2.flip(frame, 1)
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)  

            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/predict', methods=['GET'])
def get_prediction():
    success, frame = cap.read()
    if success:
        frame = cv2.flip(frame, 1)
        roi = frame[y1:y2, x1:x2]
        current_symbol = predict_symbol(roi)
        return jsonify({"symbol": current_symbol})
    return jsonify({"error": "Unable to capture frame"})

@app.route("/word_suggestions")
def word_suggestions():
    word = request.args.get("word", "")
    suggestions = hs.suggest(word)[:3]
    return jsonify({"suggestions": suggestions})

if __name__ == "__main__":
    app.run(debug=True)
