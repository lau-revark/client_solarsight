import sys
import Quartz
import Vision
from Foundation import NSURL

def recognize_text(image_path):
    url = NSURL.fileURLWithPath_(image_path)
    handler = Vision.VNImageRequestHandler.alloc().initWithURL_options_(url, None)
    
    request = Vision.VNRecognizeTextRequest.alloc().init()
    request.setRecognitionLevel_(Vision.VNRequestTextRecognitionLevelAccurate)
    
    success, error = handler.performRequests_error_([request], None)
    if success:
        results = request.results()
        text = "\n".join(res.topCandidates_(1)[0].string() for res in results)
        return text
    else:
        return ""

for img in [
    "assets/Phoenix-Solar-Sight-01 copy.png",
    "assets/Phoenix-Solar-Sight-01.png",
    "assets/Phoenix-Solar-Sight-02 copy.png",
    "assets/Phoenix-Solar-Sight-02.png",
    "assets/Phoenix-Solar-Sight-03.png",
]:
    print(f"--- {img} ---")
    try:
        print(recognize_text(img))
    except Exception as e:
        print(e)
