function compareTime(timeString1, timeSpring2){
    let dateTime1 = new Date(timeString1)
    let dateTime2 = new Date(timeSpring2)
    return dateTime1.getTime() > dateTime2.getTime()
}

module.exports={
    compareTime
}