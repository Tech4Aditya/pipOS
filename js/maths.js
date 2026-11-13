

function partial_overlap(x1,x2,width1,width2) {
              var left = Math.max(x1, x2); 
              var right = Math.min(x1 + width1, x2 + width2); 
              var ov = right - left;
              // because negitive also means no overlap, we return 0 in that case
              return Math.max(0, ov);
  
}

function miss(x1,x2,width1,width2) {
              var miss= partial_overlap(x1, x2, width1, width2) <3 ? true : false;
              return miss;
}

function isPerfectDrop(x1,x2) {
    var perfect= Math.abs(x1 - x2) < 5 ? true : false;
    return perfect;
  
}


module.exports = { partial_overlap, miss, isPerfectDrop };