(lambda (n)
  (cond
    ((zero? n) 0)
    ((zero? (- n 1)) 1)
    (else (+ (?? (- n 1)) (?? (- n 2))))))
