<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function build()
    {
        return $this->from('infos.humanjobs@gmail.com', 'Scholora')
                    ->subject('Test Laravel Mail')
                    ->view('emails.test');
    }
}
