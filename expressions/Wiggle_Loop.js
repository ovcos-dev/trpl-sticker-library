// 초당 2회·진폭 20으로 흔들리고 3초마다 자연스럽게 반복되는 wiggle
freq = 2;
amp = 20;
loopTime = 3;
t = time % loopTime;
w1 = wiggle(freq, amp, 1, 0.5, t);
w2 = wiggle(freq, amp, 1, 0.5, t - loopTime);
linear(t, 0, loopTime, w1, w2);
