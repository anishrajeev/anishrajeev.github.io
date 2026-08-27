(lambda (num)
  (cond
    ((zero? (modulo num 2)) #t)
    (else #f)))
