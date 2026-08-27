;fib1
((lambda (mk-fib)
  (mk-fib mk-fib))
  (lambda (fib)
    (lambda (n)
      (cond
        ((zero? n) 0)
        ((zero? (- n 1)) 1)
        (else (+ (fib (- n 1)) (fib (- n 2))))))))

;fib2
((lambda (mk-fib)
  (mk-fib
   (mk-fib mk-fib)))
  (lambda (fib)
    (lambda (n)
      (cond
        ((zero? n) 0)
        ((zero? (- n 1)) 1)
        (else (+ (fib (- n 1)) (fib (- n 2))))))))

;fib3
((lambda (mk-fib)
  (mk-fib
   (mk-fib
    (mk-fib mk-fib))))
  (lambda (fib)
    (lambda (n)
      (cond
        ((zero? n) 0)
        ((zero? (- n 1)) 1)
        (else (+ (fib (- n 1)) (fib (- n 2))))))))
