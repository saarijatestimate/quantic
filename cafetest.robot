*** Settings ***
Library    Browser

*** Test Cases ***
Open homepage
    New Browser    chromium    headless=false
    New Page    http://127.0.0.1:5173
    Get Title    *= Cafe
    Capture Page Screenshot    filename=robot-homepage.png
    Close Browser
