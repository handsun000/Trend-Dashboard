package com.trend.backend.batch;

import com.trend.backend.domain.StockHistory;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration
@RequiredArgsConstructor
public class MarketDataSyncJobConfig {

    private final MarketDataItemReader reader;
    private final MarketDataItemProcessor processor;
    private final MarketDataItemWriter writer;

    @Bean
    public Job marketDataSyncJob(JobRepository jobRepository, Step syncStep) {
        return new JobBuilder("MarketDataSyncJob", jobRepository)
                .start(syncStep)
                .build();
    }

    @Bean
    public Step syncStep(JobRepository jobRepository, PlatformTransactionManager transactionManager) {
        return new StepBuilder("syncStep", jobRepository)
                .<StockHistory, StockHistory>chunk(500, transactionManager)
                .reader(reader)
                .processor(processor)
                .writer(writer)
                .build();
    }
}
