;base fib
(lambda (fib)
  (lambda (n)
    (cond
      ((zero? n) 0)
      ((zero? (- n 1)) 1)
      (else (+ (fib (- n 1)) (fib (- n 2)))))))

;fib1
((lambda (fib)
  (lambda (n)
    (cond
      ((zero? n) 0)
      ((zero? (- n 1)) 1)
      (else (+ (fib (- n 1)) (fib (- n 2)))))))
 (lambda (fib)
   (lambda (n)
     (cond
       ((zero? n) 0)
       ((zero? (- n 1)) 1)
       (else (+ (fib (- n 1)) (fib (- n 2))))))))

;fib2
((lambda (fib)
   (lambda (n)
     (cond
       ((zero? n) 0)
       ((zero? (- n 1)) 1)
       (else (+ (fib (- n 1)) (fib (- n 2)))))))
 ((lambda (fib)
   (lambda (n)
     (cond
       ((zero? n) 0)
       ((zero? (- n 1)) 1)
       (else (+ (fib (- n 1)) (fib (- n 2)))))))
  (lambda (fib)
    (lambda (n)
      (cond
        ((zero? n) 0)
        ((zero? (- n 1)) 1)
        (else (+ (fib (- n 1)) (fib (- n 2)))))))))

;fib3
((lambda (fib)
  (lambda (n)
    (cond
      ((zero? n) 0)
      ((zero? (- n 1)) 1)
      (else (+ (fib (- n 1)) (fib (- n 2)))))))
 ((lambda (fib)
    (lambda (n)
      (cond
        ((zero? n) 0)
        ((zero? (- n 1)) 1)
        (else (+ (fib (- n 1)) (fib (- n 2)))))))
  ((lambda (fib)
    (lambda (n)
      (cond
        ((zero? n) 0)
        ((zero? (- n 1)) 1)
        (else (+ (fib (- n 1)) (fib (- n 2)))))))
   (lambda (fib)
     (lambda (n)
       (cond
         ((zero? n) 0)
         ((zero? (- n 1)) 1)
         (else (+ (fib (- n 1)) (fib (- n 2))))))))))
